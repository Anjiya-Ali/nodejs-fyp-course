const mongoose = require('mongoose')
const { Schema } = mongoose;

const chatSchema = new Schema({
  persons_ids: {
    type: [Number],
    required: true
  }
})

const chat = mongoose.model('Chat', chatSchema);
module.exports = chat