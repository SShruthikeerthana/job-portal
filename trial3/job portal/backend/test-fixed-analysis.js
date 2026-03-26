const RejectionAnalyzer = require('./services/rejectionAnalyzer');

// Test with ML Engineer job
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  skills: ['python', 'tensorflow', 'machine learning'],
  experience: 3,
  resume: 'uploads/resumes/some_resume.pdf'
};

const testJob = {
  title: 'ML Engineer',
  company: 'Microsoft',
  experience: '2',
  experienceYears: 2,
  location: 'Bengaluru',
  salary: '100000',
  skills: [], // Empty to test extraction from description
  keywords: [],
  description: 'We are looking for a Machine Learning Engineer with experience in Python, TensorFlow, and deep learning. The candidate should have strong knowledge of ML algorithms and neural networks.'
};

console.log('Testing ML Engineer Analysis...');
console.log('================================');

const analysis = RejectionAnalyzer.analyzeApplication(testUser, testJob);
console.log('\nAnalysis Result:');
console.log(JSON.stringify(analysis, null, 2));

const insights = RejectionAnalyzer.generateRejectionInsights(analysis);
console.log('\nGenerated Insights:');
console.log(JSON.stringify(insights, null, 2));

console.log('\nExpected Results:');
console.log('- Should extract ML skills from description');
console.log('- Should show good keyword match');
console.log('- Should show relevant missing skills if any');
console.log('- Should show accurate experience analysis');
