const mongoose = require('mongoose')
const { Schema } = mongoose;

const userPostsSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Posts',
    required: true
  }
})

const userPosts = mongoose.model('UserPosts', userPostsSchema);
module.exports = userPosts