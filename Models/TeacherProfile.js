const mongoose = require('mongoose');
const { Schema } = mongoose;

const teacherProfileSchema = new Schema({
  teacher_profile_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profile_picture: {
    type: String
  },
  language: {
    type: String
  },
  bio_information: {
    type: String,
    minLength:5
  },
  education: {
    type: String
  },
  experience: {
    type: String
  },
  honors_and_awards: {
    type: String
  },
  total_followers: {
    type: Number,
    required: true,
    default:0
  },
  total_connections: {
    type: Number,
    required: true,
    default:0
  },
  projects: {
    type: String
  },
  certificates: {
    type: String
  },
  skills: {
    type: String
  },
  feedback: {
    type: String
  },
});

const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema); // Corrected model name
module.exports = TeacherProfile;