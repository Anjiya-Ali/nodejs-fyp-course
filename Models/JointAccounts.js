const mongoose = require('mongoose')
const { Schema } = mongoose;

const jointAccountsSchema = new Schema({
  course_id: {
    type: Schema.Types.ObjectId,
    ref: 'Courses',
    required: true
  },
  invited_teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  inviting_teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  invitation_message: {
    type: String,
    required: true
  }
})

const jointAcccounts = mongoose.model('JointAccounts', jointAccountsSchema);
module.exports = jointAcccounts