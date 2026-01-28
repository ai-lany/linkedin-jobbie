const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Salary = new Schema({
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['yearly', 'monthly', 'weekly', 'daily', 'hourly'],
    default: 'yearly'
  }
}, { _id : false });

const jobSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  questions: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'A job can have a maximum of 5 questions'
    }
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  numberOfApplicants: {
    type: Number,
    default: 0
  },
  salary: {
    type: Salary,
    default: {
      min: 0,
      max: 0,
      currency: 'USD',
      period: 'yearly'
    },
    required: false
  },
  locationType: {
    type: String,
    enum: ['Remote', 'Hybrid', 'Onsite'],
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
