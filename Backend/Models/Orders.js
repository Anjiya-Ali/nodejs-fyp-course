const mongoose = require('mongoose')
const { Schema } = mongoose;

const ordersSchema = new Schema({
    student_id: {
        type: Schema.Types.ObjectId,
        ref: 'StudentProfile',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    purpose: {
        type: String,
        required: true,
        minLength:3
    },
    payment_status: {
        type: String,
        required: true,
        minLength:3
    },
})

const Orders = mongoose.model('Orders', ordersSchema);
module.exports = Orders