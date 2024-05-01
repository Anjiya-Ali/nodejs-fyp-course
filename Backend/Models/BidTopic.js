const mongoose = require('mongoose')
const { Schema } = mongoose;

const bidTopicSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true
  },
  title: {
    type: String,
    required: true,
    minLength:3
  },
  description: {
    type: String,
    required: true,
    minLength:5
  },
  skills_required: {
    type: String,
    required: true
  },
  rate_per_hour: {
    type: Number,
    required: true
  },
  estimated_hours: {
    type: Number,
    required: true
  },
  bid_count: {
    type: Number,
    required: true,
    default:0
  },
  initiated_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  language: {
    type: String,
    required: true,
    minLength:3
  }
})

const bidTopic = mongoose.model('BidTopic', bidTopicSchema);
module.exports = bidTopic