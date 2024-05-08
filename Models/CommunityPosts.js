const mongoose = require('mongoose');
const { Schema } = mongoose;

const communityPostsSchema = new Schema({
  community_id: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Posts',
    required: true,
  },
});

const CommunityPosts = mongoose.model('CommunityPosts', communityPostsSchema);
module.exports = CommunityPosts;