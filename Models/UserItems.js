const mongoose = require('mongoose')
const { Schema } = mongoose;

const userItemsSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true
  },
  item_id: {
    type: Schema.Types.ObjectId,
    ref: 'LearningPosts',
    required: true
  },
  item_type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    minLength:3
  },
  graduation: {
    type: String,
    required: false,
    minLength:3
  }
})

const userItems = mongoose.model('UserItems', userItemsSchema);
module.exports = userItems