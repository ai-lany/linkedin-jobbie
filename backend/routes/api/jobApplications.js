const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Job = mongoose.model('Job');
const JobApplication = mongoose.model('JobApplication');
const { requireUser } = require('../../config/passport');

// Get all applications for a specific job (only by job poster)
router.get('/job/:jobId', requireUser, async (req, res, next) => {
  try {
    // Verify the user is the one who posted the job
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      return next(error);
    }
    
    if (job.postedBy.toString() !== req.user._id.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      error.errors = { message: 'You can only view applications for jobs you posted' };
      return next(error);
    }

    const applications = await JobApplication.find({ job: req.params.jobId })
                                             .populate('applicant', '_id username email phoneNumber')
                                             .sort({ createdAt: -1 });
    return res.json(applications);
  } catch(err) {
    next(err);
  }
});

// Get all applications by the current user
router.get('/user/me', requireUser, async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicant: req.user._id })
                                             .populate('job')
                                             .populate({
                                               path: 'job',
                                               populate: {
                                                 path: 'company',
                                                 select: 'name location industry'
                                               }
                                             })
                                             .sort({ createdAt: -1 });
    return res.json(applications);
  } catch(err) {
    return res.json([]);
  }
});

// Get single application by ID
router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id)
                                            .populate('applicant', '_id username email phoneNumber')
                                            .populate({
                                              path: 'job',
                                              populate: {
                                                path: 'company',
                                                select: 'name location industry'
                                              }
                                            });
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if user is either the applicant or the job poster
    const job = await Job.findById(application.job._id);
    if (application.applicant._id.toString() !== req.user._id.toString() && 
        job.postedBy.toString() !== req.user._id.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      return next(error);
    }

    return res.json(application);
  } catch(err) {
    next(err);
  }
});

// Submit a job application
router.post('/', requireUser, async (req, res, next) => {
  try {
    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      job: req.body.job,
      applicant: req.user._id
    });

    if (existingApplication) {
      const error = new Error('Already applied');
      error.statusCode = 400;
      error.errors = { message: 'You have already applied to this job' };
      return next(error);
    }

    const newApplication = new JobApplication({
      job: req.body.job,
      applicant: req.user._id,
      responses: req.body.responses || [],
      coverLetter: req.body.coverLetter
    });

    let application = await newApplication.save();
    application = await application.populate('applicant', '_id username email');
    application = await application.populate({
      path: 'job',
      populate: {
        path: 'company',
        select: 'name location'
      }
    });
    
    return res.json(application);
  } catch(err) {
    next(err);
  }
});

// Update application status (only by job poster)
router.patch('/:id/status', requireUser, async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id).populate('job');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      return next(error);
    }

    // Verify user posted the job
    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      error.errors = { message: 'Only the job poster can update application status' };
      return next(error);
    }

    application.status = req.body.status;
    await application.save();

    return res.json(application);
  } catch(err) {
    next(err);
  }
});

// Delete/withdraw application (only by applicant before review)
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      applicant: req.user._id
    });

    if (!application) {
      const error = new Error('Application not found or unauthorized');
      error.statusCode = 404;
      return next(error);
    }

    if (application.status !== 'pending') {
      const error = new Error('Cannot withdraw');
      error.statusCode = 400;
      error.errors = { message: 'Cannot withdraw application after it has been reviewed' };
      return next(error);
    }

    await JobApplication.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Application withdrawn successfully' });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
