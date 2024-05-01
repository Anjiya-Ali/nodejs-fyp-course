const mongoose = require('mongoose');
const { Schema } = mongoose;

const postsSchema = new Schema({

    description: {
        type: String,
        required: true,
        minLength: 5
    },
    file_attachments: {
        type: [String],
        required: false,
    },
    total_likes: {
        type: Number,
        required: true,
        default: 0
    },
    like_members: {
        type: [String],
        required: false
    },
    total_comments: {
        type: Object,
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
});

const Posts = mongoose.model('Posts', postsSchema);
module.exports = Posts;