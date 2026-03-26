class ResumeAnalyzer {
  static extractKeywordsFromText(text) {
    if (!text) return [];
    
    const commonTech = [
      'javascript', 'react', 'nodejs', 'python', 'java', 'mongodb', 'sql', 'html', 'css',
      'aws', 'docker', 'git', 'machine learning', 'ml', 'data science', 'angular', 'vue',
      'django', 'flask', 'typescript', 'express', 'postgresql', 'mysql', 'kubernetes',
      'jenkins', 'api', 'rest', 'graphql', 'microservices', 'devops', 'cloud',
      'azure', 'gcp', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'deep learning',
      'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'go', 'rust',
      'linux', 'ubuntu', 'windows', 'macos', 'gitlab', 'bitbucket', 'jira',
      'agile', 'scrum', 'waterfall', 'ci/cd', 'testing', 'unit testing',
      'integration', 'deployment', 'monitoring', 'logging', 'security', 'authentication',
      'authorization', 'oauth', 'jwt', 'encryption', 'blockchain', 'web3',
      'react native', 'flutter', ' xamarin', 'cordova', 'electron', 'next.js',
      'gatsby', 'webpack', 'babel', 'eslint', 'prettier', 'jest', 'mocha',
      'chai', 'selenium', 'cypress', 'postman', 'swagger', 'openapi'
    ];
    
    const lowerText = text.toLowerCase();
    const foundKeywords = [];
    
    commonTech.forEach(tech => {
      if (lowerText.includes(tech.toLowerCase())) {
        foundKeywords.push(tech);
      }
    });
    
    // Extract years of experience
    const experienceMatches = lowerText.match(/(\d+)\s*(years?|yrs?|+|\+)/g);
    let totalExperience = 0;
    if (experienceMatches) {
      experienceMatches.forEach(match => {
        const years = parseInt(match.match(/\d+/)[0]);
        if (years > totalExperience) {
          totalExperience = years;
        }
      });
    }
    
    return {
      keywords: [...new Set(foundKeywords)],
      experience: totalExperience,
      textLength: text.length
    };
  }
  
  static analyzeResumeContent(resumePath) {
    // This is a simplified version - in production, you'd use actual resume parsing libraries
    // For now, we'll simulate based on file path and user profile
    
    return {
      keywords: [],
      experience: 0,
      education: [],
      projects: [],
      textLength: 0
    };
  }
}

module.exports = ResumeAnalyzer;
