const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobApplicationSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responses: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'accepted', 'rejected'],
    default: 'pending'
  },
  coverLetter: {
    type: String
  },
  resume: {
    type: String
  }
}, {
  timestamps: true
});

// Prevent duplicate applications from the same user to the same job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
