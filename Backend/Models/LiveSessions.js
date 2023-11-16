const mongoose = require('mongoose')
const { Schema } = mongoose;

const liveSessionsSchema = new Schema({
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  profile_picture: {
    type: String,
    required: true
  },
  feedback: {
    type: Object,
    required: true
  },
  interests: {
    type: [String],
    required: true
  },
})

const liveSessions = mongoose.model('LiveSessions', liveSessionsSchema);
module.exports = liveSessions