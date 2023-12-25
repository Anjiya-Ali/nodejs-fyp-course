const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');
const Lessons = require('../Models/Lessons');
const Courses = require('../Models/Courses');
const fetchuser = require('../Middlewares/fetchuser');

//Create Lesson

router.post('/CreateLesson', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const course = await Courses.findOne({ _id: new ObjectId(req.body.course_id) });

        if (!course) {
            return res.status(404).json({ success, error: "Course not found" });
        }

        const lesson = await Lessons.create({
            title : req.body.title,
            lesson_order : req.body.lesson_order,
            course_id : req.body.course_id
        });

        const data = {
            lesson:{
                id: lesson.id
            }
        }

        success = true;
        res.json({ success, data })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating Lesson");
    }
});

//Get All Lessons of a course

router.get('/GetLessonsOfCourse/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const lessons = await Lessons.find({course_id: new ObjectId(key)}).lean().exec();

        success = true;
        res.json({ success, lessons });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching lessons.");
    }
});

//Update Lesson

router.put('/UpdateLesson/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { title, lesson_order } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const lesson = await Lessons.findOne({ _id: new ObjectId(key) });

        if (!lesson) {
            return res.status(404).json({ success, error: "lesson not found" });
        }

        lesson.title = title;
        lesson.lesson_order = lesson_order;

        await lesson.save();

       
        success = true;
        res.json({ success, lesson });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the lesson");
    }
});

//delete lesson

router.delete('/DeleteLesson/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const lesson = await Lessons.findOne({ _id: new ObjectId(key) });

        if (!lesson) {
            return res.status(404).json({ success, error: "Lesson not found" });
        }

        await Lessons.deleteOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the lesson");
    }
});

module.exports = router