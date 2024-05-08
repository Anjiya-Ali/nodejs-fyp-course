const express = require('express');
const router = express.Router();
const BidTopic = require('../Models/BidTopic');
const TeacherBid = require('../Models/TeacherBid');
const Hirer = require('../Models/Hirer');
const mongoose=require('mongoose');
const fetchuser = require('../Middlewares/fetchuser');
const StudentProfile = require('../Models/StudentProfile');
const TeacherProfile = require('../Models/TeacherProfile');
const Orders = require('../Models/Orders');
const User = require('../Models/User');

router.post('/CreateStudentTopicRequest', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const title = req.body.title;
            const description = req.body.description;
            const estimated_hours = req.body.estimated_hours;
            const rate_per_hour = req.body.rate_per_hour;
            const skills_required = JSON.stringify(req.body.skills_required)
            const language = req.body.language;
            const initiated_date = new Date();
            const bid_count = 0;

            await BidTopic.create({
                student_id: new ObjectId(student_profile_id),
                title: title,
                description: description,
                skills_required: skills_required,
                rate_per_hour: rate_per_hour,
                estimated_hours: estimated_hours,
                bid_count: bid_count,
                initiated_date: initiated_date,
                language: language,
            })

            const Success = true;
            res.json({ Success })
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Creating Topic Request");
    }
})

router.get('/DeleteTopicRequest/:topicRequestId', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const topicRequestId = req.params.topicRequestId;
            let success;
            const bids = await TeacherBid.find({
                topic_id : new ObjectId(topicRequestId),
                status: { $in: ["Active", "Pending", "Closed"] }
            });

            if(bids.length === 0){
                const filter = {
                    topic_id: new ObjectId(topicRequestId)
                };

                const filter1 = {
                    _id: new ObjectId(topicRequestId)
                };

                const deleteResult = await TeacherBid.deleteMany(filter);

                const deleteResult1 = await BidTopic.deleteOne(filter1);

                success = true;
                res.json({ success });
            }
            else{
                success = false;
                return res.status(200).json({ success, message: "Cannot Delete the Topic Request" });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Deleting Topic Request");
    }
})

router.get('/GetStudentTopicRequest', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const studentTopicRequests = await BidTopic.find({ student_id : new ObjectId(student_profile_id) }).sort({ initiated_date: -1 })
            .lean()
            .exec();
            let topicRequestInfo = [];
            let success;

            if(studentTopicRequests.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Topic Requests Posted Yet" });
            }
            else{

                let feedback = 0;
                
                if(studentProfile.feedback){
                    //feedback
                    const feedbackArray = studentProfile.feedback.split(' ').map(Number);
                    if (feedbackArray.length > 0) {
                        feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;
                    }
                }

                for (const request of studentTopicRequests) {
    
                    const mem = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
                    const user = await User.findOne({ _id: new ObjectId(request.student_id) });
                    const teacherbid = await TeacherBid.find({ topic_id : new ObjectId(request._id) });

                    let booll;
                    if(teacherbid.length > 0){
                        booll = true
                    }
                    else{
                        booll = false
                    }

                    const date = new Date(request.initiated_date);
                    const options = { day: 'numeric', month: 'short', year: 'numeric' };
                    const formattedDate = date.toLocaleDateString('en-US', options);
    
                    topicRequestInfo.push({
                        id: user._id,
                        name: user.first_name + " " + user.last_name,
                        profile_picture: mem.profile_picture,
                        bio: studentProfile.bio_information,
                        feedback: feedback,
                        connections: studentProfile.total_connections,
                        location: user.country,
                        title: request.title,
                        description: request.description,
                        estimated_hours: request.estimated_hours,
                        rate_per_hour: request.rate_per_hour,
                        skills_required: JSON.parse(request.skills_required),
                        language: request.language,
                        bid_count: request.bid_count,
                        initiated_date: formattedDate,
                        topic_request_id: request._id,
                        proposals: booll
                    });
                }
                success = true;
                res.json({ success, topicRequestInfo });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Topic Request");
    }
})

router.get('/ViewTopicRequestProposals/:topicRequestId', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const topicRequestId = req.params.topicRequestId;
            const teacherbid = await TeacherBid.find({ topic_id : new ObjectId(topicRequestId), status: "Requested" });
            let teacherBidInfo = [];
            let success;

            if(teacherbid.length == 0){
                success = true;
                return res.status(200).json({ success, teacherBidInfo });
            }
            else{
                for (const bid of teacherbid) {
    
                    const mem = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(bid.teacher_id) });
                    const user = await User.findOne({ _id: new ObjectId(bid.teacher_id) });

                    let feedback = 0
                    let feed = JSON.parse(mem.feedback)

                    if(feed){
                        const totalFeedback = feed.reduce((sum, feedback) => sum + parseInt(feedback.feedback), 0);
                        feedback = totalFeedback / feed.length;
                    }
    
                    teacherBidInfo.push({
                        teacher_id: bid.teacher_id,
                        name: user.first_name + " " + user.last_name,
                        profile_picture: mem.profile_picture,
                        bio: mem.bio_information,
                        rate_per_hour: bid.rate_per_hour,
                        proposal_description: bid.proposal_description,
                        rate: feedback
                    });
                }
                success = true;
                res.json({ success, teacherBidInfo });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Proposals for Topic Request");
    }
})

router.get('/GetAllProposals', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const requests = await BidTopic.find({ student_id : new ObjectId(student_profile_id) });
            let proposalsInfo = [];
            let success;

            if(requests.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const req of requests) {
                    const teacherbid = await TeacherBid.find({ topic_id : req._id });
                    if(teacherbid.length == 0){
                        continue
                    }
                    else{
                        for(const bid of teacherbid){
                            const user = await User.findOne({ _id : bid.teacher_id })
                            proposalsInfo.push({
                                teacher_name: user.first_name + " " + user.last_name,
                                title: req.title,
                                description: bid.proposal_description,
                                status: bid.status,
                                topic_request_id: req._id,
                                teacher_bid_id: bid._id
                            });
                        }
                    }
                }
                success = true;
                res.json({ success, proposalsInfo });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Proposals for Topic Request");
    }
})

router.get('/ViewSingleProposal/:proposalId', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const proposalId = req.params.proposalId;
            const bid = await TeacherBid.findOne({ _id : new ObjectId(proposalId) });
            const request = await BidTopic.findOne({ _id : bid.topic_id });
            const mem = await TeacherProfile.findOne({ teacher_profile_id : bid.teacher_id });
            const user = await User.findOne({ _id: bid.teacher_id });

            let proposalInfo = {
                proposalId: proposalId,
                teacher_id: mem.teacher_profile_id,
                teacher_dp: mem.profile_picture,
                teacher_name: user.first_name + " " + user.last_name,
                title: request.title,
                rate_per_hour: bid.rate_per_hour,
                description: bid.proposal_description,
                student_id: student_profile_id,
                student_dp: studentProfile.profile_picture,
            };
            const Success = true;
            res.json({ Success, proposalInfo })
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Topic Request Proposal");
    }
})

router.get('/GetActiveProposals', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const requests = await BidTopic.find({ student_id : new ObjectId(student_profile_id) });
            let proposalsInfo = [];
            let success;

            if(requests.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const req of requests) {
                    const teacherbid = await TeacherBid.find({ topic_id : req._id, status: "Active" });
                    if(teacherbid.length == 0){
                        continue
                    }
                    else{
                        for(const bid of teacherbid){
                            const teacher = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(bid.teacher_id) });
                            const user = await User.findOne({ _id : new ObjectId(bid.teacher_id) });
                            proposalsInfo.push({
                                title: req.title,
                                description: bid.proposal_description,
                                status: bid.status,
                                topic_request_id: req._id,
                                teacher_id: bid.teacher_id,
                                teacher_bid_id: bid._id,
                                teacher_dp: teacher.profile_picture,
                                teacher_name: user.first_name + " " + user.last_name,
                                teacher_email: user.email
                            });
                        }
                    }
                }
                success = true;
                res.json({ success, proposalsInfo });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Proposals for Topic Request");
    }
})

router.get('/GetRequestedProposals', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const requests = await BidTopic.find({ student_id : new ObjectId(student_profile_id) });
            let proposalsInfo = [];
            let success;

            if(requests.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const req of requests) {
                    const teacherbid = await TeacherBid.find({
                        topic_id: req._id,
                        status: { $in: ["Requested", "Pending"] }
                    });                    
                    if(teacherbid.length == 0){
                        continue
                    }
                    else{
                        for(const bid of teacherbid){
                            proposalsInfo.push({
                                title: req.title,
                                status: bid.status,
                                description: bid.proposal_description,
                                topic_request_id: req._id,
                                teacher_id: bid.teacher_id,
                                teacher_bid_id: bid._id
                            });
                        }
                    }
                }
                success = true;
                res.json({ success, proposalsInfo });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Proposals for Topic Request");
    }
})

router.get('/DeleteTeacherProposal/:proposalId/:topicRequestId', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const proposalId = req.params.proposalId;
            const topicRequestId = req.params.topicRequestId;
            let success;

            const filter = {
                _id : new ObjectId(proposalId)
            };

            const deleteResult = await TeacherBid.deleteOne(filter);

            const request = await BidTopic.findOne({ _id : new ObjectId(topicRequestId) });
            request.bid_count = request.bid_count - 1;
            await request.save();

            success = true;
            res.json({ success });
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Deleting Topic Request");
    }
})

router.get('/GetClosedProposals', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const requests = await BidTopic.find({ student_id : new ObjectId(student_profile_id) });
            let proposalsInfo = [];
            let success;

            if(requests.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const req of requests) {
                    const teacherbid = await TeacherBid.find({ topic_id : req._id, status: "Closed" });
                    if(teacherbid.length == 0){
                        continue
                    }
                    else{
                        for(const bid of teacherbid){
                            proposalsInfo.push({
                                title: req.title,
                                status: bid.status,
                                description: bid.proposal_description,
                                topic_request_id: req._id,
                                teacher_bid_id: bid._id
                            });
                        }
                    }
                }
                success = true;
                res.json({ success, proposalsInfo });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Proposals for Topic Request");
    }
})

router.get('/getPayTopicRequestDetails/:proposalId', fetchuser, async (req, res)=>{
    try{
        const student_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        else{
            const proposalId = req.params.proposalId;
            const bid = await TeacherBid.findOne({ _id : new ObjectId(proposalId) });
            const request = await BidTopic.findOne({ _id : bid.topic_id });
            const mem = await TeacherProfile.findOne({ teacher_profile_id : bid.teacher_id });
            const user = await User.findOne({ _id: bid.teacher_id });

            let feedback = 0
            let feed = JSON.parse(mem.feedback)

            if(feed){
                const totalFeedback = feed.reduce((sum, feedback) => sum + parseInt(feedback.feedback), 0);
                feedback = totalFeedback / feed.length;
            }

            let proposalInfo = {
                proposalId: proposalId,
                teacher_id: mem.teacher_profile_id,
                teacher_name: user.first_name + " " + user.last_name,
                title: request.title,
                total: bid.rate_per_hour * request.estimated_hours,
                rate: feedback
            };
            const Success = true;
            res.json({ Success, proposalInfo })
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Topic Request Proposal");
    }
})

router.post('/PayTopicRequest/:proposalId', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const order = await Orders.create({
            student_id: student_profile_id,
            amount : req.body.amount,
            purpose : 'request',
            payment_status : 'pending',
        });

        const proposalId = req.params.proposalId;
        const bid = await TeacherBid.findOne({ _id : new ObjectId(proposalId) });
        const hirer = await Hirer.create({
            teacher_id: bid.teacher_id,
            topic_id : bid.topic_id,
            order_id: order._id,
            status: "Not Given"
        });

        const teacherbid = await TeacherBid.findOne({ _id : new ObjectId(proposalId) });
        teacherbid.status = "Pending"
        await teacherbid.save();

        success = true;
        res.json({ success })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while creating Order");
    }
});

//For giving feedback, use /AddFeedback/:teacher_profile_id from Teacher.js

router.get('/EndContract/:proposalId', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const proposalId = req.params.proposalId;
        const teacherbid = await TeacherBid.findOne({ _id : new ObjectId(proposalId) });
        teacherbid.status = "Closed"
        await teacherbid.save();

        success = true;
        res.json({ success })
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while Ending the Contract");
    }
});

module.exports = router