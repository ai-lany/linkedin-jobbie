const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Job = mongoose.model('Job');
const JobApplication = mongoose.model('JobApplication');
const User = mongoose.model('User');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'external-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/public/applications - Submit job application (no auth required)
router.post('/', upload.single('resume'), async (req, res, next) => {
  try {
    const { jobId, email, fullName, phone, coverLetter, responses } = req.body;

    // Validate required fields
    if (!jobId || !email || !fullName) {
      const err = new Error('Job ID, email, and full name are required');
      err.statusCode = 400;
      return next(err);
    }

    // Check if job exists and is external
    const job = await Job.findById(jobId);
    if (!job) {
      const err = new Error('Job not found');
      err.statusCode = 404;
      return next(err);
    }

    if (job.applicationType !== 'external') {
      const err = new Error('This job does not accept external applications');
      err.statusCode = 403;
      return next(err);
    }

    // Find or create a guest user for this application
    let applicant = await User.findOne({ email: email.toLowerCase() });
    
    if (!applicant) {
      // Create a guest user account
      applicant = await User.create({
        username: email.split('@')[0] + '-' + Date.now(),
        email: email.toLowerCase(),
        hashedPassword: 'external-applicant-no-password',
        phoneNumber: phone
      });
    }

    // Parse responses if it's a JSON string
    let parsedResponses = [];
    if (responses) {
      try {
        parsedResponses = typeof responses === 'string' ? JSON.parse(responses) : responses;
      } catch (e) {
        parsedResponses = [];
      }
    }

    // Create application
    const application = await JobApplication.create({
      job: jobId,
      applicant: applicant._id,
      responses: parsedResponses,
      coverLetter: coverLetter,
      resume: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application._id
    });
  } catch (err) {
    // Handle duplicate application error
    if (err.code === 11000) {
      const error = new Error('You have already applied to this job');
      error.statusCode = 400;
      return next(error);
    }
    next(err);
  }
});

module.exports = router;
