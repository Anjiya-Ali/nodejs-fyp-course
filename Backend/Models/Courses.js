const mongoose = require('mongoose')
const { Schema } = mongoose;

const coursesSchema = new Schema({
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'LearningPosts',
    required: true
  },
  language: {
    type: String,
    required: true,
    minLength:3
  },
  fees: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: String,
    required: true,
    minLength:3
  },
  rating: {
    type: String,
    required: false
  }
})

const courses = mongoose.model('Courses', coursesSchema);
module.exports = courses