const mongoose = require('mongoose');
const { Schema } = mongoose;

const meetingsSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    minLength:3
  },
  date: {
    type: Date,
    required: true

  },
});

const Meetings = mongoose.model('Meetings', meetingsSchema);
module.exports = Meetings;
