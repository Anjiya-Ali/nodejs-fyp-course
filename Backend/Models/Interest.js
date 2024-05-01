const mongoose = require('mongoose')
const { Schema } = mongoose;

const interestSchema = new Schema({
  name: {
    type: String,
    required: true
  }
})

const interest = mongoose.model('Interest', interestSchema);
module.exports = interest