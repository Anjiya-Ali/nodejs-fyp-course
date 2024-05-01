const mongoose = require('mongoose')
const { Schema } = mongoose;

const hirerSchema = new Schema({

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
  order_id: {
    type: Schema.Types.ObjectId,
    ref: 'Orders',
    required: true
  },
  status: {
    type: String,
    required: true
  },
})

const hirer = mongoose.model('Hirer', hirerSchema);
module.exports = hirer