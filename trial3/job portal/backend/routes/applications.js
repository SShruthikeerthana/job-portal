const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { isEmployer } = require('../middleware/role');
const User = require('../models/User');
const RejectionAnalyzer = require('../services/rejectionAnalyzer');

// ✅ Multer setup for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Test file upload endpoint
router.post('/test-upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    console.log('=== TEST FILE UPLOAD ===');
    console.log('User ID:', req.user.userId);
    console.log('File received:', req.file);
    console.log('File details:', {
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      path: req.file?.path
    });
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file received' });
    }
    
    res.json({
      message: 'File upload test successful',
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('File upload test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to debug application issues
router.get('/test', authMiddleware, async (req, res) => {
  try {
    console.log('=== TEST ENDPOINT ===');
    console.log('User ID:', req.user.userId);
    
    const user = await User.findById(req.user.userId);
    const jobs = await Job.find().limit(1);
    
    console.log('User found:', user?.email);
    console.log('Jobs found:', jobs.length);
    
    res.json({
      message: 'Test successful',
      user: user?.email,
      jobsAvailable: jobs.length,
      firstJob: jobs[0]?.title
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Apply for a job (Jobseeker)
router.post('/apply/:jobId', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user;

    console.log('=== NEW APPLICATION ANALYSIS ===');
    console.log('Application request received for job:', jobId, 'by user:', userId);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    // Validate inputs
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('=== JOB DETAILS ===');
    console.log('Job found:', job.title);
    console.log('Job skills:', job.skills);
    console.log('Job experience:', job.experience);
    console.log('Job experienceYears:', job.experienceYears);
    console.log('Job description length:', job.description?.length || 0);

    console.log('=== USER DETAILS ===');
    console.log('User found:', user.email);
    console.log('User skills:', user.skills);
    console.log('User experience:', user.experience);
    console.log('User resume:', user.resume);

    // Check if already applied
    const existingApplication = await Application.findOne({ job: jobId, user: userId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Analyze the application for potential rejection reasons
    const analysis = await RejectionAnalyzer.analyzeApplication(user, job);
    
    console.log('=== ANALYSIS RESULT ===');
    console.log('Missing skills:', analysis.missingSkills);
    console.log('Experience gap:', analysis.experienceGap);
    console.log('Keyword match:', analysis.keywordMatch + '%');
    console.log('Reasons:', analysis.reasons);
    console.log('Suggestions:', analysis.suggestions);
    
    const application = new Application({
      job: job._id,
      user: userId,
      resume: `uploads/resumes/${req.file.filename}`,
      status: 'Applied',
      rejectionAnalysis: analysis
    });

    await application.save();
    
    // Generate insights for the user
    const insights = RejectionAnalyzer.generateRejectionInsights(analysis);
    
    console.log('=== GENERATED INSIGHTS ===');
    console.log('Severity:', insights.severity);
    console.log('Color:', insights.color);
    console.log('Sections count:', insights.sections.length);
    insights.sections.forEach((section, index) => {
      console.log(`Section ${index + 1}: ${section.title} - ${section.content}`);
    });
    
    res.status(201).json({ 
      message: 'Application submitted successfully', 
      application,
      insights: insights
    });
  } catch (err) {
    console.error('=== ERROR IN APPLICATION ===');
    console.error('Error details:', err);
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    
    // Send more specific error message
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    
    res.status(500).json({ 
      message: 'Server error during application submission', 
      error: err.message 
    });
  }
});

// ✅ View all applications by a jobseeker
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const applications = await Application.find({ user: userId })
      .populate('job')
      .populate('statusUpdatedBy', 'name')
      .select('-resume');
    
    // Generate insights for each application
    const applicationsWithInsights = applications.map(app => {
      const appObj = app.toObject();
      if (appObj.rejectionAnalysis) {
        appObj.insights = RejectionAnalyzer.generateRejectionInsights(appObj.rejectionAnalysis);
      }
      return appObj;
    });
    
    res.status(200).json({ applications: applicationsWithInsights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get application insights
router.get('/insights/:applicationId', authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    console.log('=== FETCHING INSIGHTS ===');
    console.log('Application ID:', applicationId);
    
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('user');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user owns this application
    if (application.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view these insights' });
    }
    
    console.log('=== INSIGHTS DATA ===');
    console.log('Job Title:', application.job.title);
    console.log('Job Skills:', application.job.skills);
    console.log('Job Experience:', application.job.experience);
    console.log('User Skills:', application.user.skills);
    console.log('User Experience:', application.user.experience);
    console.log('Stored Analysis:', application.rejectionAnalysis);
    
    if (!application.rejectionAnalysis) {
      return res.status(404).json({ message: 'No analysis available for this application' });
    }
    
    const insights = RejectionAnalyzer.generateRejectionInsights(application.rejectionAnalysis);
    
    console.log('=== GENERATED INSIGHTS ===');
    console.log('Severity:', insights.severity);
    console.log('Sections:', insights.sections.length);
    insights.sections.forEach((section, index) => {
      console.log(`Section ${index + 1}: ${section.title}`);
      console.log(`Content: ${section.content}`);
      console.log(`Type: ${section.type}`);
    });
    
    res.status(200).json({ 
      application,
      analysis: application.rejectionAnalysis,
      insights
    });
  } catch (err) {
    console.error('=== ERROR IN INSIGHTS ===');
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ View all applications for a job (Employer)
router.get('/job/:jobId/applications', authMiddleware, isEmployer, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the employer owns this job
    if (job.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('user', 'name email')
      .populate('statusUpdatedBy', 'name');
    
    res.status(200).json({ applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Update application status (Employer)
router.put('/status/:applicationId', authMiddleware, isEmployer, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the employer owns the job this application is for
    if (application.job.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Update the application status
    application.status = status;
    application.statusUpdatedAt = Date.now();
    application.statusUpdatedBy = req.user.userId;
    await application.save();

    res.status(200).json({ message: 'Application status updated', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resume for an application (Employer only)
router.get('/resume/:applicationId', authMiddleware, isEmployer, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId).populate('job');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the employer owns the job this application is for
    if (application.job.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view this resume' });
    }

    // Send the resume file path
    res.status(200).json({ resumePath: application.resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload Resume
router.post('/resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.resume = `uploads/resumes/${req.file.filename}`;
    await user.save();
    res.status(200).json({ success: true, resume: user.resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
