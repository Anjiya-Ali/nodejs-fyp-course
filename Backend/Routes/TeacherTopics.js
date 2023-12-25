const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');
const LearningPosts = require('../Models/LearningPosts');
const LessonItems = require('../Models/LessonItems');
const multer = require('multer');
const fetchuser = require('../Middlewares/fetchuser');
const date = Date.now();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'Uploads/TopicVideos';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${date}_${file.originalname}`);
    }
});

const upload = multer({ storage }).single('content_video');

// Create Topic

router.post('/CreateTopic', fetchuser, upload, async (req, res) => {  
    let success = false;
    let content = 'No Video Uploaed';

    if (req.file) {
        const uniqueFilename = `${date}_${req.file.originalname}`;
        content = `Uploads/TopicVideos/${uniqueFilename}`;
    }

    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        // Creation of learning post
        const learning_post = await LearningPosts.create({
            title: req.body.title,
            content: content,
            status: 'published',
            author_user_id: teacher_profile_id,
            post_type: 'topic'
        });

        const data = {
            post: {
                id: learning_post.id
            }
        }

        success = true;
        res.json({ success, data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: "Some error occurred while creating the topic" });
    }
});

// Add Topic To Lesson

router.post('/AddTopic', fetchuser, async (req, res) => {  
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const lesson_id = req.body.lesson_id;
    const post_id = req.body.post_id;
    const item_order = req.body.item_order;
    const duration = req.body.duration;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        // Creation of learning post
        const topic = await LessonItems.create({
            post_id: post_id,
            lesson_id: lesson_id,
            item_order: item_order,
            duration: duration
        });

        const data = {
            post: {
                id: topic.id
            }
        }

        success = true;
        res.json({ success, data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: "Some error occurred while adding the topic to a lesson" });
    }
});

//Update Topic Status

router.put('/UpdateTopicStatus/:key', fetchuser, async (req, res) => {  

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

        const post = await LearningPosts.findOne({ _id: key});

        if (!post) {
            return res.status(404).json({ success, error: "Topic not found" });
        }

        post.status = status;
        await post.save();

        success = true;
        res.json({ success, post });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the topic status");
    }
});

//Update Topic

router.put('/UpdateTopic/:key', fetchuser, upload, async (req, res) => {  

    let success = false;

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { title } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const uniqueFilename = `${date}_${req.file.originalname}`;

        const topic = await LearningPosts.findOne({ _id: new ObjectId(key) });

        if (!topic) {
            return res.status(404).json({ success, error: "Topic not found" });
        }

        topic.title = title;
        topic.content = `Uploads/TopicVideos/${uniqueFilename}`;

        await topic.save();

        success = true;
        res.json({ success, topic });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the topic");
    }
});

//Update Topic Order

router.put('/UpdateTopicOrder/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { item_order, lesson_id } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const topic = await LessonItems.findOne({ _id: new ObjectId(key), lesson_id: new ObjectId(lesson_id) });

        if (!topic) {
            return res.status(404).json({ success, error: "Topic not found" });
        }

        topic.item_order = item_order;

        await topic.save();

        success = true;
        res.json({ success, topic });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the topic order in a lesson");
    }
});

//Delete Topic

router.delete('/DeleteTopic/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: new ObjectId(key) });

        if (!post) {
            return res.status(404).json({ success, error: "Topic not found" });
        }

        await LessonItems.deleteMany({ post_id: new ObjectId(key) });
        await LearningPosts.deleteOne({ _id: new ObjectId(key)});

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the topic");
    }
});

//Remove Topic

router.delete('/RemoveTopic/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const lesson_id = req.body.lesson_id;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: new ObjectId(key) });

        if (!post) {
            return res.status(404).json({ success, error: "Topic not found" });
        }

        await LessonItems.deleteMany({ post_id: new ObjectId(key), lesson_id: new ObjectId(lesson_id) });

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while removing the topic");
    }
});

//Get All Topics of a lesson

router.get('/GetLessonTopics/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const topics = await LessonItems.find({lesson_id: new ObjectId(key)}).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: topics.map(topic => topic.post_id) },
            post_type: 'topic',
            author_user_id: new ObjectId(teacher_profile_id),
        }).lean().exec();

        const topicsWithLearningPosts = topics
            .map(topic => {
                const matchingLearningPost = learningPosts.find(post => post._id.equals(topic.post_id));
                return matchingLearningPost ? {
                    post_id: matchingLearningPost._id,
                    title: matchingLearningPost.title,
                    item_order: topic.item_order,
                } : null;
            })
            .filter(topic => topic !== null); // Remove null entries

        success = true;
        res.json({ success, topicsWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching lesson topics.");
    }
});

// Get Single Topic

router.get('/GetSingleTopic/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success, post });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching single topic");
    }
});

//Get Topics By Status

router.get('/GetTopicsByStatus', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const status = req.body.status; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const topics = await LearningPosts.find({author_user_id: new ObjectId(teacher_profile_id), post_type: 'topic', status: status}).lean().exec();

        success = true;
        res.json({ success, topics });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching topics with.");
    }
});

//Get Admin topics

router.get('/GetTopics', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const topics = await LearningPosts.find({author_user_id: new ObjectId(teacher_profile_id), post_type: 'topic'}).lean().exec();

        success = true;
        res.json({ success, topics });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching topics with.");
    }
});

module.exports = router