const mongoose = require('mongoose')
const { Schema } = mongoose;

const personCallSchema = new Schema({
  call_id: {
    type: Schema.Types.ObjectId,
    ref: 'Call',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

const personCall = mongoose.model('PersonCall', personCallSchema);
module.exports = personCall