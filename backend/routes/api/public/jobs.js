const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = mongoose.model('Job');

// GET /api/public/jobs/:jobId - Get job details (no auth required)
router.get('/:jobId', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('company', 'name description industry location website size')
      .populate('postedBy', 'username');

    if (!job) {
      const err = new Error('Job not found');
      err.statusCode = 404;
      return next(err);
    }

    // Only return jobs marked as external
    if (job.applicationType !== 'external') {
      const err = new Error('This job does not accept external applications');
      err.statusCode = 403;
      return next(err);
    }

    res.json({
      _id: job._id,
      title: job.title,
      description: job.description,
      location: job.location,
      jobType: job.jobType,
      questions: job.questions,
      company: {
        _id: job.company._id,
        name: job.company.name,
        description: job.company.description,
        industry: job.company.industry,
        location: job.company.location,
        website: job.company.website,
        size: job.company.size
      },
      postedBy: job.postedBy ? job.postedBy.username : 'Unknown',
      createdAt: job.createdAt
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/jobs - Get all external jobs (optional, for listing page)
router.get('/', async (req, res, next) => {
  try {
    const jobs = await Job.find({ applicationType: 'external' })
      .populate('company', 'name industry location')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(jobs.map(job => ({
      _id: job._id,
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      company: {
        name: job.company.name,
        industry: job.company.industry,
        location: job.company.location
      },
      createdAt: job.createdAt
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
