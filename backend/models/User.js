const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    hashedPassword: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String
    },
    resume: {
      type: String  // URL or file path to uploaded resume
    },
    workHistory: [{
      company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
      },
      title: {
        type: String,
        required: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      }
    }],
    additionalInfo: {
      workAuthorizationInCountry: {
        type: Boolean
      },
      needsVisa: {
        type: Boolean
      },
      ethnicity: {
        type: String
      },
      veteran: {
        type: String
      },
      disability: {
        type: String
      },
      resumeTailoring: {
        type: Boolean
      },
      autoApply: {
        type: Boolean
      },
      gender: {
        type: String
      },
      willingToRelocate: {
        type: Boolean
      }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);