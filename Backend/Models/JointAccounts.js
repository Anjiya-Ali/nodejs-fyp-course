const mongoose = require('mongoose')
const { Schema } = mongoose;

const jointAccountsSchema = new Schema({
  course_id: {
    type: Schema.Types.ObjectId,
    ref: 'Courses',
    required: true
  },
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  }
})

const jointAcccounts = mongoose.model('JointAccounts', jointAccountsSchema);
module.exports = jointAcccounts