const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionAnswersSchema = new Schema({
    question_id: {
        type: Schema.Types.ObjectId,
        ref: 'QuizQuestions',
        required: true
    },
    title: {
        type: String,
        required: true,
        minLength:3
    },
    order: {
        type: Number,
        required: true
    },
    is_true: {
        type: Boolean,
        required: true,
        default:false
    },
});

const QuestionAnswer = mongoose.model('QuestionAnswer', questionAnswersSchema); // Corrected model name
module.exports = QuestionAnswer;
