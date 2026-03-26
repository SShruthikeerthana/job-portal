const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    default: []
  },
  keywords: {
    type: [String],
    default: []
  },
  postedAt: {
    type: Date,
    default: Date.now
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Job', jobSchema);
