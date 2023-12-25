const express = require('express');
const router = express.Router();
const Codes = require('../Models/Codes');
const User = require('../Models/User');
const SocialHub = require('../Models/SocialHub');
const LiveSessions = require('../Models/LiveSessions');
const multer = require('multer');
const mongoose=require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');
const StudentProfile = require('../Models/StudentProfile');
const date = Date.now();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'Uploads/SessionImages';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${date}_${file.originalname}`);
    }
});

const upload = multer({ storage });

const fetchuser = require('../Middlewares/fetchuser');

router.post('/CreateLiveSession', fetchuser, upload.single('featured_image'), async (req, res) => {  

    let success = false;

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const uniqueFilename = `${date}_${req.file.originalname}`;
        const combinedDateTime = new Date(`${req.body.date}T${req.body.time}Z`);

        const live_session = await LiveSessions.create({
            teacher_id: new ObjectId(teacher_profile_id),
            title : req.body.title,
            day: new Date(combinedDateTime),
            featured_image : `Uploads/SessionImages/${uniqueFilename}`,
            status: "Todo",
            post_status: "Published",
            meeting_id: req.body.meeting_id
        });
        
        success = true;
        res.json({ success, live_session })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating courses");
    }
});

router.put('/UpdateLiveSession/:key', fetchuser, upload.single('featured_image'), async (req, res) => {  

    let success = false;

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const uniqueFilename = `${Date.now()}_${req.file.originalname}`;

        const session = await LiveSessions.findOne({ _id: new ObjectId(key) });

        if (!session) {
            return res.status(404).json({ success, error: "Session not found" });
        }

        const combinedDateTime = new Date(`${req.body.date}T${req.body.time}Z`);
        session.day = new Date(combinedDateTime);
        session.title = req.body.title;
        session.featured_image = `Uploads/SessionImages/${uniqueFilename}`,

        await session.save();

        success = true;
        res.json({ success, session });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the session");
    }
});

router.put('/UpdateLiveSessionStatus/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const status = req.body.status; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const session = await LiveSessions.findOne({ _id: new ObjectId(key) });

        if (!session) {
            return res.status(404).json({ success, error: "Session not found" });
        }

        session.post_status = status;
        await session.save();

        success = true;
        res.json({ success, session });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the session status");
    }
});

router.delete('/DeleteLiveSession/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const session = await LiveSessions.findOne({ _id: new ObjectId(key) });

        if (!session) {
            return res.status(404).json({ success, error: "Session not found" });
        }

        await LiveSessions.deleteOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the session");
    }
});

router.get('/GetAllLiveSessions', fetchuser, async (req, res) => {
    let success = false;
    const person_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(person_id) });
        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const privilegeCodeOfFollow = await Codes.findOne({ code: 'Follow' });

        const followedTeachers = await SocialHub.find({
            $and: [
                { person_2_id: new ObjectId(person_id) },
                { relationship_id: privilegeCodeOfFollow._id }
            ]
        })

        if(followedTeachers.length == 0){
            success = true
            return res.status(200).json({ success, message: "No upcoming sessions" });
        }
        else{
            let liveSessionsInfo = [];

            for (const followedTeacher of followedTeachers) {

                const teacherId = followedTeacher.person_1_id;
                const teacher = await User.findOne({ _id : new ObjectId(teacherId) });
                const teacherName = teacher.first_name + " " + teacher.last_name;

                const liveSessionsByTeacher = await LiveSessions.find({ 
                    $and: [
                        { teacher_id : new ObjectId(teacherId) },
                        { status : "Todo" }
                    ]
                 });

                 for (const liveSession of liveSessionsByTeacher){

                    liveSessionsInfo.push({
                        liveSessionTitle: liveSession.title,
                        liveSessionImage: liveSession.featured_image,
                        liveSessionTeacher: teacherName
                    });

                 }
            }
            success = true;
            if(liveSessionsInfo.length == 0){
                return res.json({ success, message: "No upcoming sessions" });
            }
            else{
                return res.json({ success, liveSessions: liveSessionsInfo });
            }
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching live sessions");
    }
});

router.get('/GetAllCurrentLiveSessions', fetchuser, async (req, res) => {
    let success = false;
    const person_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(person_id) });
        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const privilegeCodeOfFollow = await Codes.findOne({ code: 'Follow' });

        const followedTeachers = await SocialHub.find({
            $and: [
                { person_2_id: new ObjectId(person_id) },
                { relationship_id: privilegeCodeOfFollow._id }
            ]
        })

        if(followedTeachers.length == 0){
            success = true
            return res.status(200).json({ success, message: "No live sessions 1" });
        }
        else{
            let liveSessionsInfo = [];

            for (const followedTeacher of followedTeachers) {

                const teacherId = followedTeacher.person_1_id;
                const teacher = await User.findOne({ _id : new ObjectId(teacherId) });
                const teacherName = teacher.first_name + " " + teacher.last_name;

                const liveSessionsByTeacher = await LiveSessions.find({ 
                    $and: [
                        { teacher_id : new ObjectId(teacherId) },
                        { status : "Live" }
                    ]
                 });

                 for (const liveSession of liveSessionsByTeacher){

                    liveSessionsInfo.push({
                        id: liveSession._id,
                        meetingId: liveSession.meeting_id,
                        liveSessionTitle: liveSession.title,
                        liveSessionImage: liveSession.featured_image,
                        liveSessionTeacher: teacherName
                    });

                 }
            }
            success = true;
            if(liveSessionsInfo.length == 0){
                return res.json({ success, message: "No live sessions" });
            }
            else{
                return res.json({ success, liveSessions: liveSessionsInfo });
            }
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching live sessions");
    }
});

router.put('/UpdateLiveSessionHls/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const status = req.body.status; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const session = await LiveSessions.findOne({ _id: new ObjectId(key) });

        if (!session) {
            return res.status(404).json({ success, error: "Session not found" });
        }

        session.status = status;
        await session.save();

        success = true;
        res.json({ success, session });
    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the session status");
    }
});

router.get('/GetMyLiveSession', fetchuser, async (req, res) => {
    let success = false;
    const person_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(person_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const liveSessionsByTeacher = await LiveSessions.find({ 
            $and: [
                { teacher_id : new ObjectId(person_id) },
                { 
                    $or: [
                        { status: "Live" },
                        { status: "Todo" }
                    ]
                },
                { post_status : "Published" }
            ]
        });

        success = true;
        if(liveSessionsByTeacher.length == 0){
            return res.json({ success, message: "No live sessions" });
        }
        else{
            return res.json({ success, liveSessionsByTeacher });
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching live sessions");
    }
});

module.exports = router