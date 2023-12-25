const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const TeacherProfile = require('../Models/TeacherProfile');
const Codes = require('../Models/Codes');
const Courses = require('../Models/Courses');
const SocialHub = require('../Models/SocialHub');
const JointAccounts = require('../Models/JointAccounts');
const mongoose=require('mongoose');
const {param, body, validationResult} = require('express-validator');

const fetchuser = require('../Middlewares/fetchuser');

router.post('/GetMyConnections', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseId = req.body.courseId;

    try {
        const userProfile = await User.findOne({ _id : new ObjectId(id) });
        if (!userProfile) {
            return res.status(400).json({ success, error: "User profile not found" });
        }

        const privilegeId = userProfile.privilege_id;
        const privilegeCode = await Codes.findOne({ _id : new ObjectId(privilegeId)});
        const privilege = privilegeCode.code;

        const privilegeCodeOfConnect = await Codes.findOne({ code: 'Connect' });

        const myConnections = await SocialHub.find({
            $and: [
                {
                    $or: [
                        { person_1_id: new ObjectId(id) },
                        { person_2_id: new ObjectId(id) }
                    ]
                },
                { status: "Accepted" },
                { relationship_id: privilegeCodeOfConnect._id }
            ]
        });        

        if (myConnections.length === 0) {
            success = true
            return res.status(200).json({ success, connections: [], privilege });
        }

        const connectionInfo = [];

        for (const connection of myConnections) {
            let otherPersonId;

            if(connection.person_1_id.equals(new ObjectId(id))){
                otherPersonId = connection.person_2_id
            }
            else if(connection.person_2_id.equals(new ObjectId(id))){
                otherPersonId = connection.person_1_id
            }

            const isInvited = await JointAccounts.findOne({ invited_teacher_id: new ObjectId(otherPersonId), inviting_teacher_id: new ObjectId(id), course_id: new ObjectId(courseId) });

            if(isInvited){
                continue;
            }
            else{
                const user = await User.findOne({ _id: new ObjectId(otherPersonId) });

                let member

                if(privilege === "Student"){
                    member = await StudentProfile.findOne({ student_profile_id: new ObjectId(otherPersonId) });
                }
                else if(privilege === "Teacher"){
                    member = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(otherPersonId) });
                }

                if (user) {
                    connectionInfo.push({
                        name: user.first_name + " " + user.last_name,
                        id: user._id,
                        profile_picture: member.profile_picture,
                        bio: member.bio_information
                    });
                }
            }
        }

        success = true;
        res.json({ success, connections: connectionInfo, privilege });
    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching connections");
    }
});

// router.get('/InviteTeacherForJointAccount/:courseId/:teacherId', fetchuser, async (req, res) => {
//     let success = false;
//     const id = req.user.id;
//     const courseId = req.params.courseId;
//     const teacherId = req.params.teacherId;
//     const ObjectId = mongoose.Types.ObjectId;

//     try{
//         const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
//         if (!teacherProfile) {
//             return res.status(400).json({ success, error: "Teacher profile not found" });
//         }

//         success = true;
//         res.json({ success, teacherId: teacherId, courseId: courseId });
//     }

//     catch (error) {
//         console.error(error.message);
//         res.status(500).send("Some error occurred while inviting a teacher for joint account");
//     }
// });

router.get('/getCourseById/:courseId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseId = req.params.courseId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const course = await Courses.findOne({ post_id : new ObjectId(courseId) });

        success = true;
        res.json({ success, course });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching course");
    }
});

router.post('/SendInvitationToTeacherForJointAccount/:courseId/:teacherId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseId = req.params.courseId;
    const teacherId = req.params.teacherId;
    const message = req.body.message;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const invitation = await JointAccounts.create({
            course_id: new ObjectId(courseId),
            inviting_teacher_id: new ObjectId(id),
            invited_teacher_id: new ObjectId(teacherId),
            status: "Pending",
            invitation_message: message
        })

        success = true;
        res.json({ success, invitation });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while sending an invitation to a teacher for joint account");
    }
});

router.get('/ViewInvitedMembersForJointAccount/:courseId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseId = req.params.courseId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const invitedMembers = await JointAccounts.find({ course_id : new ObjectId(courseId), status: "Pending" });

        let memberInfo = [];

        if(invitedMembers.length == 0){
            success = true;
            return res.status(200).json({ success, memberInfo });
        }
        else{

            for (const member of invitedMembers) {

                const mem = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(member.invited_teacher_id) });

                const user = await User.findOne({ _id: new ObjectId(member.invited_teacher_id) });

                memberInfo.push({
                    id: user._id,
                    name: user.first_name + " " + user.last_name,
                    bio: mem.bio_information,
                    profile_picture: mem.profile_picture,
                    status: member.status
                });
            }

            success = true;
            res.json({ success, memberInfo });
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while viewing invited teachers for a joint account");
    }
});

router.get('/ViewAcceptedMembersForJointAccount/:courseId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const courseId = req.params.courseId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const invitedMembers = await JointAccounts.find({ course_id : new ObjectId(courseId), status: "Accepted" });

        let memberInfo = [];

        if(invitedMembers.length == 0){
            success = true;
            return res.status(200).json({ success, memberInfo });
        }
        else{

            for (const member of invitedMembers) {

                const mem = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(member.invited_teacher_id) });

                const user = await User.findOne({ _id: new ObjectId(member.invited_teacher_id) });

                memberInfo.push({
                    id: user._id,
                    name: user.first_name + " " + user.last_name,
                    bio: mem.bio_information,
                    profile_picture: mem.profile_picture,
                    status: member.status
                });
            }

            success = true;
            res.json({ success, memberInfo });
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while viewing invited teachers for a joint account");
    }
});

router.get('/ViewJointAccountRequests', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const jointAccountRequests = await JointAccounts.find({ invited_teacher_id : new ObjectId(id), status : "Pending" });

        let jointAccountRequestsInfo = [];

        if(jointAccountRequests == []){
            success = true;
            return res.status(200).json({ success, jointAccountRequestsInfo });
        }
        else{

            for (const request of jointAccountRequests) {

                const mem = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(request.inviting_teacher_id) });

                const user = await User.findOne({ _id: new ObjectId(request.inviting_teacher_id) });

                const course = await Courses.findOne({ post_id: new ObjectId(request.course_id) });

                jointAccountRequestsInfo.push({
                    jointAccountRequestId: request._id,
                    id: request.inviting_teacher_id,
                    courseId: request.course_id,
                    courseName: course.name,
                    name: user.first_name + " " + user.last_name,
                    profile_picture: mem.profile_picture
                });
            }

            success = true;
            res.json({ success, jointAccountRequestsInfo });
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while viewing joint account requests");
    }
});

router.delete('/withdrawInvitation/:memberId/:courseId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const memberId = req.params.memberId;
    const courseId = req.params.courseId;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const userProfile = await User.findOne({ _id : new ObjectId(id) });
        if (!userProfile) {
            return res.status(400).json({ success, error: "User profile not found" });
        }

        const filter = {
            inviting_teacher_id: new ObjectId(id),
            invited_teacher_id: new ObjectId(memberId),
            course_id: new ObjectId(courseId),
            status: 'Pending'
        };
        
        const deleteResult = await JointAccounts.deleteOne(filter);

        success = true;
        res.json({ success, deleteResult });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while withdrawing joint account request");
    }
});

router.get('/ViewDetailsOfJoinAccountRequest/:jointAccountRequestId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const jointAccountRequestId = req.params.jointAccountRequestId;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const jointAccountRequests = await JointAccounts.findOne({ _id : new ObjectId(jointAccountRequestId) });

        let jointAccountRequestDetail = {}

        if(jointAccountRequests == null){
            success = true;
            return res.status(200).json({ success, jointAccountRequestDetail });
        }
        else{
            const course = await Courses.findOne({ post_id: new ObjectId(jointAccountRequests.course_id) });

            const user = await User.findOne({ _id: new ObjectId(jointAccountRequests.inviting_teacher_id) });

            jointAccountRequestDetail = {
                courseName: course.name,
                message: jointAccountRequests.invitation_message,
                jointAccountRequestId: jointAccountRequests._id,
                name: user.first_name + " " + user.last_name,
            }
            success = true;
            res.json({ success, jointAccountRequestDetail });
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while viewing joint account request detail");
    }
});

router.get('/AcceptJointAccountRequest/:jointAccountRequestId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const jointAccountRequestId = req.params.jointAccountRequestId;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const jointAccountRequest = await JointAccounts.findOne({ _id : new ObjectId(jointAccountRequestId) });
        jointAccountRequest.status = "Accepted";
        jointAccountRequest.save();

        success = true;
        res.json({ success });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while accepting invitation for a joint account request");
    }
});

router.delete('/RejectJointAccountRequest/:jointAccountRequestId', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const jointAccountRequestId = req.params.jointAccountRequestId;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const filter = {
            _id: new ObjectId(jointAccountRequestId)
        };
        
        const deleteResult = await JointAccounts.deleteOne(filter);

        success = true;
        res.json({ success, deleteResult });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while rejecting invitation for a joint account request");
    }
});

module.exports = router