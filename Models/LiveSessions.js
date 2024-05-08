const mongoose = require('mongoose')
const { Schema } = mongoose;

const liveSessionsSchema = new Schema({
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  day: {
    type: Date,
    required: true
  },
  featured_image: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  post_status: {
    type: String,
    required: true
  },
  meeting_id: {
    type: String,
    required: true
  }
})

const liveSessions = mongoose.model('LiveSessions', liveSessionsSchema);
module.exports = liveSessions