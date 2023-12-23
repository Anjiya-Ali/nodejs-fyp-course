const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentProfileSchema = new Schema({
    student_profile_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    profile_picture: {
        type: String
    },
    feedback: {
        type: String
    },
    interests: {
        type: String
    },
    total_connections: {
        type: Number,
        required: true,
        default:0
    },
    language: {
        type: String
    },
    education: {
        type: String
    },
    badges: {
        type: String
    },
    certificates: {
        type: String
    },
    bio_information: {
        type: String,
        minLength:5
    },
});

const studentProfile = mongoose.model('StudentProfile', studentProfileSchema);
module.exports = studentProfile;