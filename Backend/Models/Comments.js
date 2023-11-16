const mongoose = require('mongoose')
const { Schema } = mongoose;

const commentsSchema = new Schema({
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Posts',
    required: true
  },
  description: {
    type: String,
    required: true,
    minLength:5
  },
  replies: {
    type: Object,
    required: true
  },
  total_likes: {
    type: Number,
    required: true,
    default:0
  }
})

const comments = mongoose.model('Comments', commentsSchema);
module.exports = comments