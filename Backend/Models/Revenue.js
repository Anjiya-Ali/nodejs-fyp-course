const mongoose = require('mongoose')
const { Schema } = mongoose;

const revenueSchema = new Schema({
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default:0
  }
})

const revenue = mongoose.model('Revenue', revenueSchema);
module.exports = revenue