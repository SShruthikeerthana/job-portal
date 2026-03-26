const RejectionAnalyzer = require('./services/rejectionAnalyzer');

// Test the analyzer with sample data
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  skills: ['JavaScript', 'React', 'Node.js'],
  experience: 2
};

const testJob = {
  title: 'Full Stack Developer',
  company: 'Tech Corp',
  skills: ['React', 'Node.js', 'MongoDB', 'Python'],
  experienceYears: 3,
  keywords: ['full stack', 'developer', 'javascript'],
  description: 'Looking for an experienced full stack developer'
};

console.log('Testing Rejection Analyzer...');
console.log('=============================');

const analysis = RejectionAnalyzer.analyzeApplication(testUser, testJob);
console.log('\nAnalysis Result:');
console.log(JSON.stringify(analysis, null, 2));

const insights = RejectionAnalyzer.generateRejectionInsights(analysis);
console.log('\nGenerated Insights:');
console.log(JSON.stringify(insights, null, 2));

console.log('\nTest completed!');
