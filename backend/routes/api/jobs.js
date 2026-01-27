const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Job = mongoose.model('Job');
const { requireUser } = require('../../config/passport');
const validateJobInput = require('../../validations/jobs');

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find()
                          .populate("postedBy", "_id username")
                          .sort({ createdAt: -1 });

    let jobsObject = {}
    jobs.forEach((job) => {
      jobsObject[job._id] = job;
    })

    return res.json(jobsObject);
  }
  catch(err) {
    return res.json([]);
  }
});

// Get single job by ID
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
                         .populate("postedBy", "_id username");
    return res.json(job);
  }
  catch(err) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    error.errors = { message: "No job found with that id" };
    return next(error);
  }
});

// Create a new job (requires authentication)
router.post('/', requireUser, validateJobInput, async (req, res, next) => {
  try {
    const newJob = new Job({
      company: req.body.company,
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      jobType: req.body.jobType,
      questions: req.body.questions || [],
      postedBy: req.user._id
    });

    let job = await newJob.save();
    job = await job.populate('postedBy', '_id username');
    return res.json(job);
  }
  catch(err) {
    next(err);
  }
});

// Update a job (only by the user who posted it)
router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      {_id: req.params.id, postedBy: req.user._id},
      {
        $set: {
          company: req.body.company,
          title: req.body.title,
          description: req.body.description,
          location: req.body.location,
          jobType: req.body.jobType,
          questions: req.body.questions
        }
      },
      {new: true}
    ).populate('postedBy', '_id username');

    if (!job){
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      error.errors = { message: 'No job found with that id or unauthorized access'};
      return next(error);
    }

    return res.json(job)
  } catch (err) {
    next(err);
  }
});

// Delete a job (only by the user who posted it)
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      postedBy: req.user._id
    });
    if (!job){
      const error = new Error('Job not found or unauthorized')
      error.statusCode = 404;
      error.errors = { message: 'No job found with that id or unauthorized access' };
      return next(error);
    }
    return res.json({ message: 'Job deleted successfully' });
  } catch(err) {
    next(err);
  }
})

module.exports = router;
