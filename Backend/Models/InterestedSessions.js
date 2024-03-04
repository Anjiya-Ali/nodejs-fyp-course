const mongoose = require('mongoose')
const { Schema } = mongoose;

const interestedSessionsSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true
  },
  session_id: {
    type: Schema.Types.ObjectId,
    ref: 'LiveSessions',
    required: true
  }
})

const interestedSessions = mongoose.model('InterestedSessions', interestedSessionsSchema);
module.exports = interestedSessions