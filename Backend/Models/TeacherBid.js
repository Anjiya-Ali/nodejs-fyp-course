const mongoose = require('mongoose')
const { Schema } = mongoose;

const teacherBidSchema = new Schema({
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  topic_id: {
    type: Schema.Types.ObjectId,
    ref: 'BidTopic',
    required: true
  },
  rate_per_hour: {
    type: Number,
    required: true,
    default:0
  },
  proposal_description: {
    type: String,
    required: true,
    minLength:5
  },
  status: {
    type: String,
    required: true,
  },
})

const teacherBid = mongoose.model('TeacherBid', teacherBidSchema);
module.exports = teacherBid