const mongoose = require('mongoose')
const { Schema } = mongoose;

const learningPostsSchema = new Schema({
  content: {
    type: String,
    required: true,
    minLength:5
  },
  title: {
    type: String,
    required: true,
    minLength:3
  },
  featured_image: {
    type: String,
    required: false
  },
  post_date: {
    type: Date,
    required: true,
    default:Date.now
  },
  status: {
    type: String,
    required: true,
    minLength:3
  },
  author_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  post_type: {
    type: String,
    required: true
  }
})

const learningPosts = mongoose.model('LearningPosts', learningPostsSchema);
module.exports = learningPosts