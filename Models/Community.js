const mongoose = require('mongoose')
const { Schema } = mongoose;

const communitySchema = new Schema({
  creator_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community_name: {
    type: String,
    required: true,
    minLength: 3
  },
  community_description: {
    type: String,
    required: false,
    default: ''
  },
  community_image: {
    type: String,
    required: false,
    default: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fcityofgood.sg%2Fcommunity-matters%2Fcommunity-development-guides%2F&psig=AOvVaw1WYGDPHemNGqpRFLI05u2_&ust=1698138709121000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMDn3OXpi4IDFQAAAAAdAAAAABAE'
  },
  
  members_id: {
    type: [String],
    required: true
  },
  requested_members_id: {
    type: [String],
    required: false
  },
  total_members: {
    type: Number,
    required: true,
    default: 1
  },

})

const community = mongoose.model('Community', communitySchema);
module.exports = community