const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['jobseeker', 'employer'], required: true },
  companyName: { type: String },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0
  },
  resume: {
    type: String,
  },
  profilePhoto: {
    type: String,
  }
});

module.exports = mongoose.model('User', userSchema);