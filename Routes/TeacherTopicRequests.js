const express = require('express');
const router = express.Router();
const BidTopic = require('../Models/BidTopic');
const TeacherBid = require('../Models/TeacherBid');
const mongoose=require('mongoose');
const fetchuser = require('../Middlewares/fetchuser');
const StudentProfile = require('../Models/StudentProfile');
const TeacherProfile = require('../Models/TeacherProfile');
const User = require('../Models/User');
const Hirer = require('../Models/Hirer');
const Community = require('../Models/Community')

router.get('/GetTeacherTopicRequest', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const topicRequests = await BidTopic.find({ });
            let topicRequestInfo = [];

            for (const request of topicRequests) {
    
                const mem = await StudentProfile.findOne({ student_profile_id : new ObjectId(request.student_id) });
                const user = await User.findOne({ _id: new ObjectId(request.student_id) });

                const date = new Date(request.initiated_date);
                const options = { day: 'numeric', month: 'short', year: 'numeric' };
                const formattedDate = date.toLocaleDateString('en-US', options);

                let feedback = 0

                if(mem.feedback){
                    //feedback
                    const feedbackArray = mem.feedback.split(' ').map(Number);
                    if (feedbackArray.length > 0) {
                        feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;
                    }
                }

                topicRequestInfo.push({
                    topic_request_id: request._id,
                    id: teacher_profile_id,
                    student_id: request.student_id,
                    location: user.country,
                    language: request.language,
                    bid_count: request.bid_count,
                    initiated_date: formattedDate,
                    title: request.title,
                    description: request.description,
                    rate_per_hour: request.rate_per_hour,
                    rate: feedback
                });
            }
            const Success = true;
            res.json({ Success, topicRequestInfo })
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Topic Request");
    }
})

router.get('/GetSingleTeacherTopicRequest/:topicRequestId', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const topicRequestId = req.params.topicRequestId;
            const request = await BidTopic.findOne({ _id : new ObjectId(topicRequestId) });
            const mem = await StudentProfile.findOne({ student_profile_id : request.student_id });
            const user = await User.findOne({ _id: new ObjectId(teacher_profile_id) });
            const user1 = await User.findOne({ _id: new ObjectId(request.student_id) });
            let feedback = 0
            if(mem.feedback){
                //feedback
                const feedbackArray = mem.feedback.split(' ').map(Number);
                if (feedbackArray.length > 0) {
                    feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;
                }
            }
            const date = new Date(request.initiated_date);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const formattedDate = date.toLocaleDateString('en-US', options);

            let topicRequestInfo = {
                topic_request_id: request._id,
                teacher_id: teacher_profile_id,
                teacher_dp: teacherProfile.profile_picture,
                teacher_name: user.first_name + " " + user.last_name,
                teacher_bio: teacherProfile.bio_information,
                title: request.title,
                rate_per_hour: request.rate_per_hour,
                initiated_date: formattedDate,
                bid_count: request.bid_count,
                description: request.description,
                estimated_hours: request.estimated_hours,
                skills_required: JSON.parse(request.skills_required),
                student_id: request.student_id,
                student_name: user1.first_name + " " + user1.last_name,
                student_dp: mem.profile_picture,
                student_bio: mem.bio_information,
                student_connections: mem.total_connections,
                rate: feedback,
                location: user1.country,
            };
            const Success = true;
            res.json({ Success, topicRequestInfo })
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Retrieving Topic Request");
    }
})

router.post('/CreateProposalBid/:topicRequestId', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const topicRequestId = req.params.topicRequestId;
            const proposal_description = req.body.description;
            const rate_per_hour = req.body.rate_per_hour;

            await TeacherBid.create({
                teacher_id: new ObjectId(teacher_profile_id),
                topic_id: new ObjectId(topicRequestId),
                rate_per_hour: rate_per_hour,
                proposal_description: proposal_description,
                status: "Requested"
            })

            const request = await BidTopic.findOne({ _id : new ObjectId(topicRequestId) });
            request.bid_count = request.bid_count + 1;
            await request.save();

            const Success = true;
            res.json({ Success })
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Creating Topic Request");
    }
})

router.get('/GetAllProposals', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const bids = await TeacherBid.find({ teacher_id : new ObjectId(teacher_profile_id) });
            let proposalsInfo = [];
            let success;

            if(bids.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const bid of bids) {
                    const request = await BidTopic.findOne({ _id : bid.topic_id });
                    proposalsInfo.push({
                        title: request.title,
                        description: bid.proposal_description,
                        rate_per_hour: bid.rate_per_hour,
                        topic_request_id: request._id,
                        teacher_bid_id: bid._id,
                        status: bid.status,
                    });
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
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const proposalId = req.params.proposalId;
            const bid = await TeacherBid.findOne({ _id : new ObjectId(proposalId) });
            const request = await BidTopic.findOne({ _id : bid.topic_id });
            const mem = await TeacherProfile.findOne({ teacher_profile_id : bid.teacher_id });
            const mem1 = await StudentProfile.findOne({ student_profile_id : request.student_id });
            const user = await User.findOne({ _id: bid.teacher_id });

            let proposalInfo = {
                proposalId: proposalId,
                teacher_id: mem.teacher_profile_id,
                teacher_dp: mem.profile_picture,
                teacher_name: user.first_name + " " + user.last_name,
                title: request.title,
                rate_per_hour: bid.rate_per_hour,
                description: bid.proposal_description,
                student_id: mem1.student_profile_id,
                student_dp: mem1.profile_picture,
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

router.get('/GetRequestedProposals', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const bids = await TeacherBid.find({
                teacher_id : new ObjectId(teacher_profile_id),
                status: { $in: ["Requested", "Pending"] }
            }); 
            let proposalsInfo = [];
            let success;

            if(bids.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const bid of bids) {
                    const request = await BidTopic.findOne({ _id : bid.topic_id });
                    proposalsInfo.push({
                        title: request.title,
                        description: bid.proposal_description,
                        rate_per_hour: bid.rate_per_hour,
                        topic_request_id: request._id,
                        teacher_bid_id: bid._id,
                        status: bid.status,
                    });
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

router.get('/GetActiveProposals', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const bids = await TeacherBid.find({ teacher_id : new ObjectId(teacher_profile_id), status: "Active" });
            let proposalsInfo = [];
            let success;

            if(bids.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const bid of bids) {
                    const request = await BidTopic.findOne({ _id : bid.topic_id });
                    proposalsInfo.push({
                        title: request.title,
                        description: bid.proposal_description,
                        rate_per_hour: bid.rate_per_hour,
                        topic_request_id: request._id,
                        teacher_bid_id: bid._id,
                        status: bid.status,
                    });
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

router.get('/GetClosedProposals', fetchuser, async (req, res)=>{ //there will be a button of providing feedback
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const bids = await TeacherBid.find({ teacher_id : new ObjectId(teacher_profile_id), status: "Closed" });
            let proposalsInfo = [];
            let success;

            if(bids.length == 0){
                success = true;
                return res.status(200).json({ success, message: "No Proposals Found" });
            }
            else{
                for (const bid of bids) {
                    const request = await BidTopic.findOne({ _id : bid.topic_id });
                    const hirer = await Hirer.findOne({ topic_id : bid.topic_id });
                    proposalsInfo.push({
                        teacher_id: bid.teacher_id,
                        title: request.title,
                        description: bid.proposal_description,
                        rate_per_hour: bid.rate_per_hour,
                        topic_request_id: request._id,
                        teacher_bid_id: bid._id,
                        status: hirer.status,
                        student_id: request.student_id,
                        bid_status: bid.status,
                    });
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

//For giving feedback, use /AddFeedback/:student_profile_id/:topic_request_id from Student.js

router.get('/WithdrawProposal/:proposalId', fetchuser, async (req, res)=>{
    try{
        const teacher_profile_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        else{
            const proposalId = req.params.proposalId;
            const bids = await TeacherBid.findOne({ _id : new ObjectId(proposalId), status: "Requested" });
            let success;

            if(bids.length === 0){
                success = true;
                return res.status(200).json({ success, message: "Cannot Withdraw" });
            }
            else{
                const filter = {
                    _id: new ObjectId(proposalId)
                };

                const deleteResult = await TeacherBid.deleteOne(filter);

                const request = await BidTopic.findOne({ _id : bids.topic_id });
                request.bid_count = request.bid_count - 1;
                await request.save();

                success = true;
                res.json({ success, deleteResult });
            }
        }
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Withdrawing Proposal for Topic Request");
    }
})

router.get('/GetPopularCommunities', fetchuser, async (req, res) => {
    try {
        const user_id = req.user.id;
        const ObjectId = mongoose.Types.ObjectId;
        const userProfile = await User.findOne({ _id: new ObjectId(user_id) });
        if (!userProfile) {
            return res.status(400).json({ success: false, error: "User profile not found" });
        }

        const communities = await Community.find({})
            .sort({ total_members: -1 })
            .limit(5);

        const Success = true;
        res.json({ Success, communities });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in Retrieving Popular Communities");
    }
});  

module.exports = router