const mongoose = require('mongoose')
const { Schema } = mongoose;

const communitySchema = new Schema({
  community_name: {
    type: String,
    required: true,
    minLength:3
  },
  creator_user_id: {
    type: Number,
    required: true
  },
  members_id: {
    type: [Number],
    required: true
  },
  total_members: {
    type: Number,
    required: true,
    default:0
  },
  
})

const community = mongoose.model('Community', communitySchema);
module.exports = community