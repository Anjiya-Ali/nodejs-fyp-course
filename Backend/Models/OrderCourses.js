const mongoose = require('mongoose')
const { Schema } = mongoose;

const orderCoursesSchema = new Schema({
    order_id: {
        type: Schema.Types.ObjectId,
        ref: 'Orders',
        required: true,
    },
    course_id: {
        type: Schema.Types.ObjectId,
        ref: 'Courses',
        required: true,
    },
})

const OrderCourses = mongoose.model('OrderCourses', orderCoursesSchema);
module.exports = OrderCourses