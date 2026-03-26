const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// POST /api/jobs - Create a new job
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('=== CREATING NEW JOB ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.userId);
    
    const { title, description, location, salary, experience, skills, experienceYears } = req.body;
    
    // Validate required fields
    if (!title || !description || !location || !salary || !experience) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, location, salary, experience are required' 
      });
    }
    
    // Get the employer's information
    const employer = await User.findById(req.user.userId);
    console.log('Employer found:', employer?.email);
    console.log('Company name:', employer?.companyName);
    
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    
    if (!employer.companyName) {
      return res.status(400).json({ 
        message: 'Company name not found. Please update your employer profile first.' 
      });
    }

    // Parse experience string to extract years if not provided
    let expYears = experienceYears || 0;
    if (!expYears && experience) {
      const match = experience.match(/(\d+)/);
      if (match) {
        expYears = parseInt(match[1]);
      }
    }
    
    console.log('Parsed experience years:', expYears);

    // Parse skills from string or array
    let jobSkills = [];
    if (skills) {
      if (typeof skills === 'string') {
        jobSkills = skills.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(skills)) {
        jobSkills = skills;
      }
    }
    
    console.log('Parsed skills:', jobSkills);

    const jobData = {
      title,
      description,
      location,
      salary,
      experience,
      experienceYears: expYears,
      skills: jobSkills,
      postedBy: req.user.userId,
      company: employer.companyName
    };
    
    console.log('Job data to save:', jobData);
    
    const job = new Job(jobData);
    
    await job.save();
    console.log('Job saved successfully:', job._id);
    
    res.status(201).json(job);
  } catch (error) {
    console.error('=== ERROR CREATING JOB ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate job posting detected' 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// GET /api/jobs - Get all jobs for jobseekers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'companyName');
    console.log('Jobs from backend:', jobs);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/jobs/dashboard - Get jobs posted by the logged-in employer
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('No userId in req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: No userId' });
    }
    console.log('Fetching jobs for employer:', req.user.userId);
    const jobs = await Job.find({ postedBy: req.user.userId });
    console.log('Jobs found:', jobs);
    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/dashboard:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

module.exports = router; 