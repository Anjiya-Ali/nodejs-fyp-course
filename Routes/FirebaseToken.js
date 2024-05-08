const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const FirebaseToken = require('../Models/FirebaseToken');
const mongoose=require('mongoose');
const fetchuser = require('../Middlewares/fetchuser');

router.post('/AddFirebaseToken', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        let existingToken = await FirebaseToken.findOne({ user_id: new ObjectId(user_id) });

        if (existingToken) {
            existingToken.token = req.body.token;
            await existingToken.save();
        } else {
            const token = await FirebaseToken.create({
                user_id: new ObjectId(user_id),
                token: req.body.token
            });
        }

        success = true;
        res.json({ success, message: "Firebase token created/replaced successfully" });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating/replacing token");
    }
});



router.post('/RemoveFirebaseToken', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const deletedToken = await FirebaseToken.findOneAndDelete({
            user_id: new ObjectId(user_id),
        });

        success = true;
        res.json({ success, message: "Firebase token removed successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while removing the token");
    }
});



module.exports = router