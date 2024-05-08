const mongoose = require('mongoose');
const { Schema } = mongoose;

const lessonItemsSchema = new Schema({
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'LearningPosts',
    required: true
  },
  lesson_id: {
    type: Schema.Types.ObjectId,
    ref: 'Lessons',
    required: true
  },
  item_order: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  }
});

const LessonItems = mongoose.model('LessonItems', lessonItemsSchema);
module.exports = LessonItems;
