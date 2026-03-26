const ResumeParser = require('./resumeParser');

class RejectionAnalyzer {
  static async analyzeApplication(user, job) {
    const analysis = {
      missingSkills: [],
      experienceGap: null,
      keywordMatch: 0,
      reasons: [],
      suggestions: []
    };

    console.log('Analyzing application for user:', user.email);
    console.log('Job details:', job.title);

    // 1. Skills matching analysis
    console.log('=== SKILLS ANALYSIS DEBUG ===');
    console.log('Job title:', job.title);
    console.log('Job description:', job.description);
    console.log('Job skills array:', job.skills);
    console.log('User skills array:', user.skills);
    console.log('User email:', user.email);
    
    // Extract skills from job title and description if job.skills is empty
    let jobSkillsList = job.skills || [];
    
    if (jobSkillsList.length === 0) {
      console.log('Job skills array is empty, extracting from title/description...');
      
      // Extract from title first
      const titleSkills = [];
      const titleLower = job.title.toLowerCase();
      const commonSkills = ['react', 'html', 'css', 'ml', 'machine learning', 'javascript', 'python', 'java', 'nodejs', 'node', 'angular', 'vue', 'django', 'flask', 'mongodb', 'sql', 'aws', 'docker', 'git', 'tensorflow', 'data science', 'typescript', 'express', 'postgresql', 'mysql', 'kubernetes', 'devops', 'api', 'rest', 'graphql', 'microservices', 'cloud', 'azure', 'gcp', 'pytorch', 'nlp', 'computer vision', 'deep learning'];
      
      commonSkills.forEach(skill => {
        if (titleLower.includes(skill.toLowerCase())) {
          titleSkills.push(skill);
        }
      });
      
      // Extract from description
      const descSkills = [];
      if (job.description) {
        const descLower = job.description.toLowerCase();
        commonSkills.forEach(skill => {
          if (descLower.includes(skill.toLowerCase())) {
            descSkills.push(skill);
          }
        });
      }
      
      jobSkillsList = [...new Set([...titleSkills, ...descSkills])];
      console.log('Extracted skills from title:', titleSkills);
      console.log('Extracted skills from description:', descSkills);
      console.log('Final extracted skills:', jobSkillsList);
    }
    
    if (jobSkillsList.length > 0) {
      let userSkills = user.skills || [];
      console.log('User skills array:', userSkills);
      console.log('User skills type:', typeof userSkills);
      
      // If user has no skills in profile, try to extract from resume
      if ((!userSkills || userSkills.length === 0) && user.resume) {
        console.log('No user skills found in profile, extracting from resume...');
        userSkills = await ResumeParser.extractSkillsFromResume(user.resume);
        console.log('Extracted skills from resume:', userSkills);
      }
      
      // Handle if userSkills is a string
      let normalizedUserSkills = [];
      if (typeof userSkills === 'string') {
        normalizedUserSkills = userSkills.split(',').map(skill => skill.toLowerCase().trim()).filter(skill => skill);
      } else if (Array.isArray(userSkills)) {
        normalizedUserSkills = userSkills.map(skill => skill.toLowerCase().trim()).filter(skill => skill);
      }
      
      const normalizedJobSkills = jobSkillsList.map(skill => skill.toLowerCase().trim());
      
      console.log('Normalized user skills:', normalizedUserSkills);
      console.log('Normalized job skills:', normalizedJobSkills);
      
      // Better matching logic
      const missingSkills = normalizedJobSkills.filter(jobSkill => {
        return !normalizedUserSkills.some(userSkill => {
          // Exact match
          if (userSkill === jobSkill) return true;
          // Partial match (userSkill contains jobSkill or vice versa)
          if (userSkill.includes(jobSkill) || jobSkill.includes(userSkill)) return true;
          return false;
        });
      });
      
      const foundSkills = normalizedJobSkills.filter(jobSkill => {
        return normalizedUserSkills.some(userSkill => {
          // Exact match
          if (userSkill === jobSkill) return true;
          // Partial match
          if (userSkill.includes(jobSkill) || jobSkill.includes(userSkill)) return true;
          return false;
        });
      });
      
      analysis.missingSkills = missingSkills;
      console.log('Missing skills after comparison:', missingSkills);
      console.log('Found skills:', foundSkills);

      if (missingSkills.length === 0) {
        analysis.reasons.push('You have all the required skills!');
        analysis.suggestions.push('Focus on showcasing your experience in these areas');
      } else {
        analysis.reasons.push(`Missing key skills: ${missingSkills.join(', ')}`);
        analysis.suggestions.push(`Learn these skills: ${missingSkills.join(', ')}`);
      }
    } else {
      console.log('No skills found in job title or description');
      analysis.reasons.push('Job skills requirements not clearly specified');
      analysis.suggestions.push('Contact employer for detailed requirements');
    }

    // 2. Experience gap analysis
    console.log('Job experienceYears:', job.experienceYears);
    console.log('Job experience string:', job.experience);
    console.log('User experience from profile:', user.experience);
    
    let requiredYears = job.experienceYears || 0;
    
    // Extract years from experience string if not available
    if (!requiredYears && job.experience) {
      const match = job.experience.match(/(\d+)/);
      if (match) {
        requiredYears = parseInt(match[1]);
      }
    }
    
    let userYears = user.experience || 0;
    
    // If user has no experience in profile, try to extract from resume
    if (!userYears && user.resume) {
      console.log('No user experience found in profile, extracting from resume...');
      userYears = await ResumeParser.extractExperienceFromResume(user.resume);
      console.log('Extracted experience from resume:', userYears);
    }
    
    console.log('Parsed required years:', requiredYears);
    console.log('User years:', userYears);
    
    if (userYears < requiredYears) {
      const gap = requiredYears - userYears;
      analysis.experienceGap = `${userYears} vs required ${requiredYears} years (gap: ${gap} years)`;
      analysis.reasons.push(`Experience gap: ${analysis.experienceGap}`);
      
      if (gap <= 2) {
        analysis.suggestions.push(`Gain ${gap} more years of relevant experience`);
      } else {
        analysis.suggestions.push(`Consider junior roles or internships first`);
      }
    }

    // 3. Keyword matching analysis
    let jobKeywords = [];
    let userKeywords = [];
    
    // Build job keywords from multiple sources
    if (job.keywords && job.keywords.length > 0) {
      jobKeywords = [...jobKeywords, ...job.keywords];
    }
    
    // Use the extracted skills list
    if (jobSkillsList.length > 0) {
      jobKeywords = [...jobKeywords, ...jobSkillsList];
    }
    
    // Always add job title words
    if (job.title) {
      const titleWords = job.title.toLowerCase().split(' ').filter(word => word.length > 2);
      jobKeywords = [...jobKeywords, ...titleWords];
    }
    
    // Extract keywords from job description
    if (job.description) {
      const commonTech = ['javascript', 'react', 'nodejs', 'python', 'java', 'mongodb', 'sql', 'html', 'css', 'aws', 'docker', 'git', 'machine learning', 'ml', 'data science', 'angular', 'vue', 'django', 'flask', 'typescript', 'express', 'mongodb', 'postgresql', 'mysql', 'kubernetes', 'jenkins', 'api', 'rest', 'graphql', 'microservices', 'devops', 'cloud', 'azure', 'gcp', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'deep learning'];
      const foundInDesc = commonTech.filter(tech => 
        job.description.toLowerCase().includes(tech.toLowerCase())
      );
      jobKeywords = [...jobKeywords, ...foundInDesc];
    }
    
    // Build user keywords
    let userSkillsList = user.skills || [];
    
    // If user has no skills in profile, try to extract from resume
    if ((!userSkillsList || userSkillsList.length === 0) && user.resume) {
      console.log('No user skills found in profile for keyword matching, extracting from resume...');
      userSkillsList = await ResumeParser.extractSkillsFromResume(user.resume);
      console.log('Extracted skills from resume for keywords:', userSkillsList);
    }
    
    if (userSkillsList.length > 0) {
      userKeywords = [...userKeywords, ...userSkillsList];
    }
    
    // TODO: Add resume keyword extraction when resume parsing is implemented
    // if (user.resume) {
    //   const resumeAnalysis = ResumeAnalyzer.analyzeResumeContent(user.resume);
    //   if (resumeAnalysis.keywords.length > 0) {
    //     userKeywords = [...userKeywords, ...resumeAnalysis.keywords];
    //     console.log('Resume keywords extracted:', resumeAnalysis.keywords);
    //   }
    // }
    
    if (user.name) {
      userKeywords = [...userKeywords, user.name.toLowerCase()];
    }
    
    // Remove duplicates
    jobKeywords = [...new Set(jobKeywords)];
    userKeywords = [...new Set(userKeywords)];
    
    console.log('Final job keywords:', jobKeywords);
    console.log('Final user keywords:', userKeywords);
    
    const matches = jobKeywords.filter(keyword =>
      userKeywords.some(userKeyword =>
        userKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(userKeyword.toLowerCase())
      )
    );
    
    analysis.keywordMatch = Math.round((matches.length / Math.max(jobKeywords.length, 1)) * 100);
    
    console.log('Keyword matches:', matches);
    console.log('Keyword match percentage:', analysis.keywordMatch);
    
    if (analysis.keywordMatch < 50) {
      analysis.reasons.push(`Low keyword match: ${analysis.keywordMatch}%`);
      analysis.suggestions.push(`Update your profile with relevant keywords from job descriptions`);
    }

    // 4. Additional insights
    if (analysis.missingSkills.length === 0 && !analysis.experienceGap && analysis.keywordMatch >= 70) {
      analysis.reasons.push('Your profile matches well - focus on interview preparation');
      analysis.suggestions.push('Practice common interview questions for this role');
    } else if (analysis.reasons.length === 0) {
      // Add some default analysis if nothing was triggered
      analysis.reasons.push('Application submitted successfully');
      analysis.suggestions.push('Prepare for potential interview calls');
    }

    // Always add some positive feedback
    if (analysis.keywordMatch >= 50) {
      analysis.reasons.push(`Good keyword match: ${analysis.keywordMatch}%`);
      analysis.suggestions.push('Your profile aligns well with job requirements');
    }

    console.log('Final analysis result:', analysis);
    return analysis;
  }

  static generateRejectionInsights(analysis) {
    const insights = {
      title: "📊 Why You Might Not Get Selected",
      severity: 'low',
      color: 'green',
      sections: []
    };

    // Determine severity based on analysis
    const issueCount = analysis.reasons.length;
    if (issueCount >= 3 || analysis.keywordMatch < 30) {
      insights.severity = 'high';
      insights.color = 'red';
    } else if (issueCount >= 2 || analysis.keywordMatch < 60) {
      insights.severity = 'medium';
      insights.color = 'orange';
    }

    // Build sections
    if (analysis.missingSkills.length > 0) {
      insights.sections.push({
        title: '🚫 Missing Skills',
        type: 'missing_skills',
        content: analysis.missingSkills,
        impact: 'high'
      });
    }

    if (analysis.experienceGap) {
      insights.sections.push({
        title: '📈 Experience Gap',
        type: 'experience_gap',
        content: analysis.experienceGap,
        impact: analysis.experienceGap.includes('gap: 3') ? 'high' : 'medium'
      });
    }

    // Always show keyword match
    insights.sections.push({
      title: '🔍 Keyword Match',
      type: 'keyword_match',
      content: `${analysis.keywordMatch}% match with job description`,
      impact: analysis.keywordMatch < 40 ? 'high' : analysis.keywordMatch < 70 ? 'medium' : 'low'
    });

    // Add suggestions section
    if (analysis.suggestions.length > 0) {
      insights.sections.push({
        title: '💡 Recommendations',
        type: 'suggestions',
        content: analysis.suggestions,
        impact: 'positive'
      });
    }

    // If no issues found, add positive section
    if (analysis.missingSkills.length === 0 && !analysis.experienceGap && analysis.keywordMatch >= 70) {
      insights.sections.unshift({
        title: '✅ Great Match!',
        type: 'positive_match',
        content: 'Your profile aligns perfectly with this job requirements',
        impact: 'positive'
      });
    }

    return insights;
  }
}

module.exports = RejectionAnalyzer;
