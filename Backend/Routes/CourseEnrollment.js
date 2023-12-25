const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const StudentProfile = require('../Models/StudentProfile');
const LearningPosts = require('../Models/LearningPosts');
const Courses = require('../Models/Courses');
const Orders = require('../Models/Orders');
const OrderCourses = require('../Models/OrderCourses');
const fetchuser = require('../Middlewares/fetchuser');

function calculateRating(course) {
    if(course.rating){
        const feedbackArray = course.rating.split(' ').map(Number);
        const feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;
        return feedback;
    }
    return 5;
}

//Get All Courses

router.get('/GetCourses', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const courses = await Courses.find({}).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: courses.map(course => course.post_id) }
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
                    rating: calculateRating(course),
                } : null;
            })
            .filter(course => course !== null); // Remove null entries

        success = true;
        res.json({ success, coursesWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching courses with learning posts.");
    }
});

// Get Single Course

router.get('/GetCourse/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const course = await Courses.findOne({_id: new ObjectId(key)}).lean().exec();
        const learningPost = await LearningPosts.findOne({_id: course.post_id}).lean().exec();

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
            rating: calculateRating(course),
        };
    
        success = true;
        res.json({ success, courseWithLearningPost });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching course with learning post.");
    }
});

//Get order course status

router.get('/GetOrderCourseStatus/:id', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseId = req.params.id;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        let payment_status = 'ADD TO CART';
        const orders = await Orders.find({ student_id: student_profile_id });

        for (const order of orders) {
            const orderCourse = await OrderCourses.findOne({
                order_id: order.id,
                course_id: courseId,
            });

            if (orderCourse) {
                payment_status = order.payment_status;
                break;
            }
        }

        success = true;
        res.json({ success, payment_status })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating Order");
    }
});

// Pay Course 

router.post('/PayCourse', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseIds = req.body.courseIds;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const order = await Orders.create({
            student_id: student_profile_id,
            amount : req.body.amount,
            purpose : 'course',
            payment_status : 'pending',
        });

        for (const courseId of courseIds) {
            await OrderCourses.create({
                order_id: order.id,
                course_id: courseId,
            });
        }

        const data = {
            order:{
                id: order.id
            }
        }

        success = true;
        res.json({ success, data })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating Order");
    }
});

// Get Pending Orders

router.get('/GetPendingOrders', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const orders = await Orders.find({student_id: new ObjectId(student_profile_id), payment_status: 'pending'}).lean().exec();

        success = true;
        res.json({ success, orders });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching pending orders.");
    }
});

// Get Single Pending Order (Get all courses against that order from OrdCourses table)

router.get('/GetSinglePendingOrder/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const orderCourses = await OrderCourses.find({order_id: new ObjectId(key)}).lean().exec();
        const courseIds = orderCourses.map(orderItem => orderItem.course_id);

        success = true;
        res.json({ success, courseIds });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching single pending order.");
    }
});

module.exports = router


