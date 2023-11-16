const mongoose = require('mongoose')
const { Schema } = mongoose;

const teacherBidSchema = new Schema({
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
  }
})

const teacherBid = mongoose.model('TeacherBid', teacherBidSchema);
module.exports = teacherBid