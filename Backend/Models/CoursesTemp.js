const mongoose = require('mongoose')
const { Schema } = mongoose;

const coursesTempSchema = new Schema({
  name: {
    type: String,
    required: true
  }
})

const coursestemp = mongoose.model('Coursestemp', coursesTempSchema);
module.exports = coursestemp