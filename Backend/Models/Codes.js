const mongoose = require('mongoose')
const { Schema } = mongoose;

const codesSchema = new Schema({

  code: {
    type: String,
    required: true,
    minLength:3
  }
})

const Codes = mongoose.model('Codes', codesSchema);
module.exports = Codes