const mongoose = require('mongoose');
const { Schema } = mongoose;

const meetingsSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'StudentProfile', // Corrected: Remove space in the model name
    required: true
  },
  title: {
    type: String,
    required: true,
    minLength:3
  },
  organizer: {
    type: String,
    required: true,
    minLength:3
  },
  date: {
    type: Date,
    required: true

  },
  time: {
    type: String, 
    required: true
  },
});

const Meetings = mongoose.model('Meetings', meetingsSchema);
module.exports = Meetings;
