const express = require('express');
const router = express.Router();
const Codes = require('../Models/Codes');
const User = require('../Models/User');
const Meetings = require('../Models/Meetings');
const multer = require('multer');
const mongoose = require('mongoose');
const date = Date.now();
const fetchuser = require('../Middlewares/fetchuser');
const FirebaseToken = require('../Models/FirebaseToken');
var admin = require("firebase-admin");

const sendPushNotification = (message) => {
    admin.messaging().send(message)
        .then((response) => {
            console.log('successfully sent', response);
        })
        .catch((error) => {
            console.log('error sending message:', error)
        })
}

router.post('/CreateScheduledMeeting', fetchuser, async (req, res) => {

    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const combinedDateTime = new Date(`${String(req.body.date)}T${String(req.body.time)}Z`);

        const scheduled_meeting = await Meetings.create({
            user_id: new ObjectId(user_id),
            title: req.body.title,
            date: combinedDateTime,
        });

        const token = await FirebaseToken.findOne({ user_id: new ObjectId(user_id) });
        const titlee = req.body.title;
        const redirect = 'ScheduledMeeting';

        if (token) {
            const message = {
                notification: {
                    title: 'Scheduled Meeting Reminder',
                    body: 'Reminder!! Your meeting " ' + titlee + ' " has been scheduled in an hour'
                },
                data: {
                    redirect: redirect
                },
                token: token.token
            }

            const datee = new Date(combinedDateTime)
            const schedule = require('node-schedule');
            var jobId = user_id + '_' + datee;

            datee.setUTCHours(datee.getUTCHours() - 1);

            schedule.scheduleJob(jobId, datee, function () {
                schedule.cancelJob(jobId);
                sendPushNotification(message);
            });
        }

        success = true;
        res.json({ success, scheduled_meeting })
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating scheduled meeting");
    }
});

router.delete('/DeleteScheduledMeeting/:key', fetchuser, async (req, res) => {

    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const user = await User.findOne({ _id: user_id });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const meeting = await Meetings.findOne({ _id: new ObjectId(key) });

        if (!meeting) {
            return res.status(404).json({ success, error: "Meeting not found" });
        }

        await Meetings.deleteOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the session");
    }
});

router.post('/GetAllScheduledMeeting/', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const requestedDate = req.body.date;

    try {
        const user = await User.findOne({ _id: user_id });

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const requestedISODate = new Date(requestedDate);
        const startOfDay = new Date(requestedISODate);

        startOfDay.setUTCHours(0, 0, 0);
        const endOfDay = new Date(requestedISODate);
        startOfDay.setDate(startOfDay.getDate() + 1);
        endOfDay.setDate(endOfDay.getDate() + 1);

        endOfDay.setUTCHours(23, 59, 59);

        const scheduled_meetings = await Meetings.find({
            user_id: user_id,
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        success = true;
        if (scheduled_meetings.length === 0) {
            return res.json({ success, message: "No Scheduled Meetings" });
        } else {
            return res.json({ success, scheduled_meetings });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching scheduled meetings");
    }
});



module.exports = router