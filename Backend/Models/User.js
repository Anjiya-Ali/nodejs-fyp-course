const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    privilege_id: {
        type: Schema.Types.ObjectId,
        ref: 'Codes',
        required: true
    },
    first_name: {
        type: String,
        required: true,
        minLength:3
    },
    last_name: {
        type: String,
        required: true,
        minLength:3
    },
    email: {
        type: String,
        unique: true,
        required: true,
        minLength:5
    },
    dob: {
        type: Date,
        required: true
    },
    password_hash: {
        type: String,
        required: true,
        minLength:5
    },
    gender: {
        type: String,
        required: true,
        minLength:4
    },
    country: {
        type: String,
        required: true,
        minLength:3
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;