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
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);