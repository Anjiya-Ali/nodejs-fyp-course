const mongoose = require('mongoose')
const { Schema } = mongoose;

const lessonsSchema = new Schema({
  course_id: {
    type: Schema.Types.ObjectId,
    ref: 'Courses',
    required: true
  },
  title: {
    type: String,
    required: true,
    minLength:3
  },
  lesson_order: {
    type: Number,
    required: true
  }
})

const lessons = mongoose.model('Lessons', lessonsSchema);
module.exports = lessons