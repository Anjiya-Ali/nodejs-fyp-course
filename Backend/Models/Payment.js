const mongoose = require('mongoose')
const { Schema } = mongoose;

const paymentSchema = new Schema({
    student_status: {
        type: Schema.Types.ObjectId,
        ref: 'Codes',
        required: true
    },
    student_id: {
        type: Schema.Types.ObjectId,
        ref: 'StudentProfile',
        required: true
    },
    teacher_id: {
        type: Schema.Types.ObjectId,
        ref: 'TeacherProfile',
        required: true
    },
    topic_id: {
        type: Schema.Types.ObjectId,
        ref: 'BidTopic',
        required: true
    },
    hirer_id: {
        type: Number,
        required: true
    },
    release_status: {
        type: String,
        required: true,
        minLength:3
    },
    amount: {
        type: Number,
        required: true,
        default:0
    },
})

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment