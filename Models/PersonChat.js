const mongoose = require('mongoose')
const { Schema } = mongoose;

const personChatSchema = new Schema({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

const personChat = mongoose.model('PersonChat', personChatSchema);
module.exports = personChat