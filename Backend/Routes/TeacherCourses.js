const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');
const LearningPosts = require('../Models/LearningPosts');
const Courses = require('../Models/Courses');
const multer = require('multer');
const fetchuser = require('../Middlewares/fetchuser');
const date = Date.now();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'Uploads/CourseImages';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${date}_${file.originalname}`);
    }
});

const upload = multer({ storage });

//Create Course

router.post('/CreateCourse', fetchuser, upload.single('featured_image'), async (req, res) => {  

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

        //creation of learning post

        const learning_post = await LearningPosts.create({
            title : req.body.title,
            content : req.body.description,
            featured_image : `Uploads/CourseImages/${uniqueFilename}`,
            status : 'published',
            author_user_id : teacher_profile_id,
            post_type : 'course'
        });

        //creation of course

        const course = await Courses.create({
            language : req.body.language,
            fees : req.body.charges,
            duration : req.body.duration,
            post_id : learning_post.id
        });

        const data = {
            course:{
                id: course.id
            }
        }

        success = true;
        res.json({ success, data })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating courses");
    }
});

//Update Course Status

router.put('/UpdateCourseStatus/:key', fetchuser, async (req, res) => {  

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

        const course = await Courses.findOne({ _id: new ObjectId(key) });

        if (!course) {
            return res.status(404).json({ success, error: "Course not found" });
        }

        const post_id = course.post_id;

        const post = await LearningPosts.findOne({ _id: post_id});

        post.status = status;
        await post.save();

        success = true;
        res.json({ success, post, course });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the course status");
    }
});

//Update Course

router.put('/UpdateCourse/:key', fetchuser, upload.single('featured_image'), async (req, res) => {  

    let success = false;

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { title, description, language, charges, duration } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const uniqueFilename = `${date}_${req.file.originalname}`;

        const course = await Courses.findOne({ _id: new ObjectId(key) });

        if (!course) {
            return res.status(404).json({ success, error: "Course not found" });
        }

        course.fees = charges;
        course.language = language;
        course.duration = duration;

        await course.save();

        const post_id = course.post_id;

        const post = await LearningPosts.findOne({ _id: post_id});

        post.title = title;
        post.content = description;
        post.featured_image = `Uploads/CourseImages/${uniqueFilename}`,

        await post.save();

        success = true;
        res.json({ success, post, course });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the course");
    }
});

//Delete Course

router.delete('/DeleteCourse/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const course = await Courses.findOne({ _id: new ObjectId(key) });

        if (!course) {
            return res.status(404).json({ success, error: "Course not found" });
        }

        const post_id = course.post_id;

        await Courses.deleteOne({ _id: new ObjectId(key) });
        await LearningPosts.deleteOne({ _id: post_id});

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the course");
    }
});

//Get All Courses

router.get('/GetCourses', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const courses = await Courses.find({}).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: courses.map(course => course.post_id) },
            author_user_id: new ObjectId(teacher_profile_id),
        }).lean().exec();

        const coursesWithLearningPosts = courses
            .map(course => {
                const matchingLearningPost = learningPosts.find(post => post._id.equals(course.post_id));
                return matchingLearningPost ? {
                    _id: course._id,
                    language: course.language,
                    fees: course.fees,
                    duration : course.duration,
                    content: matchingLearningPost.content,
                    title: matchingLearningPost.title,
                    featured_image: matchingLearningPost.featured_image,
                    status: matchingLearningPost.status,
                    author_user_id: matchingLearningPost.author_user_id,
                    post_date: matchingLearningPost.post_date,
                } : null;
            })
            .filter(course => course !== null); // Remove null entries

        res.json({ success, coursesWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching courses with learning posts.");
    }
});

// Get Single Course

router.get('/GetCourse/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const course = await Courses.findOne({_id: new ObjectId(key)}).lean().exec();
        const learningPost = await LearningPosts.findOne({_id: course.post_id, author_user_id: new ObjectId(teacher_profile_id)}).lean().exec();

        const courseWithLearningPost = {
            _id: course._id,
            language: course.language,
            fees: course.fees,
            duration : course.duration,
            content: learningPost.content,
            title: learningPost.title,
            featured_image: learningPost.featured_image,
            status: learningPost.status,
            author_user_id: learningPost.author_user_id,
            post_date: learningPost.post_date,
        };
    
        res.json({ success, courseWithLearningPost });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching course with learning post.");
    }
});

//Get Courses By Status

router.get('/GetCoursesByStatus', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const status = req.body.status; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const courses = await Courses.find({}).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: courses.map(course => course.post_id) },
            author_user_id: new ObjectId(teacher_profile_id),
            status: status
        }).lean().exec();

        const coursesWithLearningPosts = courses
            .map(course => {
                const matchingLearningPost = learningPosts.find(post => post._id.equals(course.post_id));
                return matchingLearningPost ? {
                    _id: course._id,
                    language: course.language,
                    fees: course.fees,
                    duration : course.duration,
                    content: matchingLearningPost.content,
                    title: matchingLearningPost.title,
                    featured_image: matchingLearningPost.featured_image,
                    status: matchingLearningPost.status,
                    author_user_id: matchingLearningPost.author_user_id,
                    post_date: matchingLearningPost.post_date,
                } : null;
            })
            .filter(course => course !== null); // Remove null entries

        res.json({ success, coursesWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching courses with.");
    }
});

module.exports = router