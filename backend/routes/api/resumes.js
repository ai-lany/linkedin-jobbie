const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const multer = require('multer');
const path = require('path');
const { requireUser } = require('../../config/passport');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp-originalname
    const uniqueSuffix = Date.now();
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter - only allow PDF, DOC, DOCX
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
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Upload resume endpoint
router.post('/upload', requireUser, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.statusCode = 400;
      return next(error);
    }

    // Store the file path in the user's resume field
    const resumePath = `/uploads/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resume: resumePath },
      { new: true }
    ).select('-hashedPassword');

    return res.json({
      message: 'Resume uploaded successfully',
      resumePath: resumePath,
      user: user
    });
  } catch (err) {
    next(err);
  }
});

// Delete resume endpoint
router.delete('/delete', requireUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.resume) {
      const error = new Error('No resume to delete');
      error.statusCode = 404;
      return next(error);
    }

    // Delete the file from filesystem
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../', user.resume);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove resume reference from user
    user.resume = null;
    await user.save();

    return res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
