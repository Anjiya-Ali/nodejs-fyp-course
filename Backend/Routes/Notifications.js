const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Notifications = require('../Models/Notifications');
const mongoose=require('mongoose');
const fetchuser = require('../Middlewares/fetchuser');

router.post('/CreateNotification', fetchuser, async (req, res) => {  

    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const notification = await Notifications.create({
            user_id: new ObjectId(user_id),
            message : req.body.message,
            redirect: req.body.redirect,
            createdAt: new Date(),
            read: false
        });
        
        success = true;
        res.json({ success, notification })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating notification");
    }
});


router.get('/GetAllNotifications', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;

    try {
        const user = await User.findOne({ _id: user_id });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const notifications = await Notifications.find({ 
            user_id: user_id,
        });

        success = true;

        if (notifications.length === 0) {
            return res.json({ success, message: "No Notifications" });
        } else {
            return res.json({ success, notifications });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching notifications");
    }
});

router.put('/MarkAsRead/:key', fetchuser, async (req, res) => {  

    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const user = await User.findOne({ _id: user_id });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const notification = await Notifications.findOne({ _id: new ObjectId(key) });

        if (!notification) {
            return res.status(404).json({ success, error: "Notification not found" });
        }

        notification.read = true;
        await notification.save();

        success = true;
        res.json({ success, notification });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the notification");
    }
});


module.exports = router