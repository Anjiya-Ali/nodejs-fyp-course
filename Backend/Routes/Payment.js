const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const Revenue = require('../Models/Revenue');
const User = require('../Models/User');
const Lessons = require('../Models/Lessons');
const Courses = require('../Models/Courses');
const Orders = require('../Models/Orders');
const UserItems = require('../Models/UserItems');
const LessonItems = require('../Models/LessonItems');
const OrderCourses = require('../Models/OrderCourses');
const Hirer = require('../Models/Hirer');
const TeacherBid = require('../Models/TeacherBid');
const fetchuser = require('../Middlewares/fetchuser');


router.get('/GetOrders', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const orders = await Orders.find().lean().exec();

        success = true;
        res.json({ success, orders });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching orders.");
    }
});

router.get('/GetPendingOrders', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const orders = await Orders.find({ payment_status: 'pending' }).lean().exec();

        success = true;
        res.json({ success, orders });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching orders.");
    }
});

router.get('/GetPaidOrders', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const orders = await Orders.find({ payment_status: 'paid' }).lean().exec();

        success = true;
        res.json({ success, orders });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching orders.");
    }
});

router.get('/GetReleasedOrders', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const orders = await Orders.find({ payment_status: 'released' }).lean().exec();

        success = true;
        res.json({ success, orders });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching orders.");
    }
});

router.post('/MarkAsPaid', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const order_id = req.body.order_id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const order = await Orders.findOne({ _id: new ObjectId(order_id) });
        order.payment_status = 'paid';
        await order.save();

        const student_id = order.student_id;

        if(order.purpose == 'course'){
            const order_course = await OrderCourses.findOne({ order_id: new ObjectId(order_id) });
            const course = await Courses.findOne({ _id: new ObjectId(order_course.course_id) });

            await UserItems.create({
                student_id: student_id,
                item_id: course.post_id,
                item_type: 'course',
                status: 'in progress'
            });

            const lesson = await Lessons.findOne({ course_id: new ObjectId(course._id), lesson_order: 1 });
            const topic = await LessonItems.findOne({ lesson_id: new ObjectId(lesson._id), item_order: 1 });

            await UserItems.create({
                student_id: student_id,
                item_id: topic.post_id,
                item_type: 'topic',
                status: 'in progress'
            });
        }

        else {
            const hirer = await Hirer.findOne({ order_id: new ObjectId(order_id) });
            const bid = await TeacherBid.findOne({ topic_id: new ObjectId(hirer.topic_id) });
            bid.status = 'Active';
            await bid.save();
        }

        success = true;
        res.json({ success, order });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while marking order as paid.");
    }
});

router.post('/MarkAsReleased', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const order_id = req.body.order_id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id)});

        if (!user) {
            return res.status(400).json({ success, error: "User not found" });
        }

        const order = await Orders.findOne({ _id: new ObjectId(order_id) });

        if(order.purpose == 'course'){
            order.payment_status = 'released';
            await order.save();
        }

        else {
            const hirer = await Hirer.findOne({ order_id: new ObjectId(order_id) });
            const bid = await TeacherBid.findOne({ topic_id: new ObjectId(hirer.topic_id) });

            if(bid.status == 'Closed'){
                order.payment_status = 'released';
                await order.save();
            }
            else{
                res.status(500).send("Proposal status is not closed.");
            }
        }

        const amount = order.amount;
        const percentage = 2.5 / 100;
        const revenueAmount = amount * percentage;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        await Revenue.create({
            month: currentMonth,
            year: currentYear.post_id,
            amount: revenueAmount,
        });

        success = true;
        res.json({ success, order });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while marking order as released.");
    }
});

module.exports = router


