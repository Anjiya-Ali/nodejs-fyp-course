const mongoose = require('mongoose')
const { Schema } = mongoose;

const socialHubSchema = new Schema({
  person_1_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  person_2_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  relationship_id: {
    type: Schema.Types.ObjectId,
    ref: 'Codes',
    required: true
  },
  status: {
    type: String,
    required: true
  }
})

const socialHub = mongoose.model('SocialHub', socialHubSchema);
module.exports = socialHub