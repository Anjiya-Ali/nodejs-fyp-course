const mongoose = require('mongoose')
const { Schema } = mongoose;

const skillsSchema = new Schema({
  name: {
    type: String,
    required: true
  }
})

const skills = mongoose.model('Skills', skillsSchema);
module.exports = skills