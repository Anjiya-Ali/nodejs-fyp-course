const mongoose = require('mongoose')
const { Schema } = mongoose;

const quizQuestionsSchema = new Schema({
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'LearningPosts',
    required: true
  },
  question_order: {
    type: Number,
    required: true
  },
  marks: {
    type: Number,
    required: true,
    default:0
  },
  content: {
    type: String,
    required: true,
    minLength:5
  }
})

const quizQuestions = mongoose.model('QuizQuestions', quizQuestionsSchema);
module.exports = quizQuestions