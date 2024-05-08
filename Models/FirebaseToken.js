const mongoose = require('mongoose')
const { Schema } = mongoose;

const firebaseTokenSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
   token: {
        type: String,
        required: true,
        minLength: 3
    }
})

const firebaseToken = mongoose.model('FirebaseToken', firebaseTokenSchema);
module.exports = firebaseToken