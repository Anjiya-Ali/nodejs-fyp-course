const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationsSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    minLength:3
  },
  redirect: {
    type: String,
    required: true,
    minLength:3
  },
  createdAt: {
    type: Date,
    required: true
  },
  read: {
    type: Boolean,
    required: true
  },
});

const Notifications = mongoose.model('Notifications', notificationsSchema);
module.exports = Notifications;
