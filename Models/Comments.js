const mongoose = require('mongoose')
const { Schema } = mongoose;

const commentsSchema = new Schema({
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Posts',
    required: true
  },
  commentor_id:{
    type:String,
    required:true
  },
  commentor_name:{
    type:String,
    required:true
  },
  description: {
    type: String,
    required: true,
    minLength: 1
  },
  parent_comment: {
    type: String,
    required: false,
  },
  like_members: {
    type: [String],
    required: false
  },
  total_likes: {
    type: Number,
    required: true,
    default: 0
  }
})

const comments = mongoose.model('Comments', commentsSchema);
module.exports = comments