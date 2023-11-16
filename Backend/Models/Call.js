const mongoose = require('mongoose')
const { Schema } = mongoose;

const callSchema = new Schema({
  persons_ids: {
    type: [Number],
    required: true
  },
  type: {
    type: String,
    required: true,
    minLength:3
  }
})

const call = mongoose.model('Call', callSchema);
module.exports = call