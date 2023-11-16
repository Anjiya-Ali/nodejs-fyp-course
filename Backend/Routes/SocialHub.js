const express = require('express');
const router = express.Router();
const Codes = require('../Models/Codes');
const User = require('../Models/User');
const SocialHub = require('../Models/SocialHub');
const mongoose=require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');
const StudentProfile = require('../Models/StudentProfile');

const fetchuser = require('../Middlewares/fetchuser');

//Appending url also is left
router.get('/GetPendingConnections/:role', fetchuser, async (req, res) => {
    let success = false;
    const person_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const pendingConnections = await SocialHub.find({ person_2_id : new ObjectId(person_id), status : "Pending" });

        if (pendingConnections.length === 0) {
            success = true
            return res.status(200).json({ success, message: "No requests" });
        }

        const connectionInfo = [];

        for (const connection of pendingConnections) {
            const otherPersonId = connection.person_1_id;

            const user = await User.findOne({ _id: new ObjectId(otherPersonId) });

            let member

            if(req.params.role === "Student"){
                member = await StudentProfile.findOne({ student_profile_id: new ObjectId(otherPersonId) });
            }
            else{
                member = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(otherPersonId) });
            }

            if (user) {
                connectionInfo.push({
                    name: user.first_name + " " + user.last_name,
                    id: user._id,
                    profile_picture: member.profile_picture
                });
            }
        }

        success = true;
        res.json({ success, connections: connectionInfo });
    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching connections");
    }
});

router.get('/GetMyConnections/:role', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
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
            return res.status(200).json({ success, message: "No connections" });
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

            const user = await User.findOne({ _id: new ObjectId(otherPersonId) });

            let member

            if(req.params.role === "Student"){
                member = await StudentProfile.findOne({ student_profile_id: new ObjectId(otherPersonId) });
            }
            else{
                member = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(otherPersonId) });
            }

            if (user) {
                connectionInfo.push({
                    name: user.first_name + " " + user.last_name,
                    id: user._id,
                    profile_picture: member.profile_picture
                });
            }
        }

        success = true;
        res.json({ success, connections: connectionInfo });
    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching connections");
    }
});

router.get('/GetMyFollowers', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const privilegeCodeOfFollow = await Codes.findOne({ code: 'Follow' });

        const myFollowers = await SocialHub.find({
            $and: [
                {person_1_id: new ObjectId(id)},
                { status: "Accepted" },
                { relationship_id: privilegeCodeOfFollow._id }
            ]
        });        

        if (myFollowers.length === 0) {
            success = true
            return res.status(200).json({ success, message: "No Followers" });
        }

        const connectionInfo = [];

        for (const follower of myFollowers) {
            
            const otherPersonId = follower.person_2_id;
            const user = await User.findOne({ _id: new ObjectId(otherPersonId) });
            const member = await StudentProfile.findOne({ student_profile_id: new ObjectId(otherPersonId) });

            if (user) {
                connectionInfo.push({
                    name: user.first_name + " " + user.last_name,
                    id: user._id,
                    profile_picture: member.profile_picture
                });
            }
        }

        success = true;
        res.json({ success, connections: connectionInfo });
    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching connections");
    }
});

router.get('/AcceptRequest/:role/:person2_id', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const person2_id = req.params.person2_id;
    const ObjectId = mongoose.Types.ObjectId;
    const role = req.params.role;

    try{
        const filter = {
            person_1_id: new ObjectId(person2_id),
            person_2_id: new ObjectId(id)
        };
    
        const update = {
            $set: { status: 'Accepted' }
        };
    
        const updateResult = await SocialHub.updateOne(filter, update);

        let connections

        if(role === "Teacher"){
            const teacherProfile1 = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(id)});
            teacherProfile1.total_connections += 1;
            await teacherProfile1.save();

            const teacherProfile2 = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(person2_id)});
            teacherProfile2.total_connections += 1;
            await teacherProfile2.save();

            connections = teacherProfile1.total_connections;
        }
        else if(role === "Student"){
            const studentprofile1 = await StudentProfile.findOne({ student_profile_id: new ObjectId(id)});
            studentprofile1.total_connections += 1;
            await studentprofile1.save();

            const studentprofile2 = await StudentProfile.findOne({ student_profile_id: new ObjectId(person2_id)});
            studentprofile2.total_connections += 1;
            await studentprofile2.save();

            connections = studentprofile1.total_connections;
        }

        success = true;
        res.json({ success, connections });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while updating connections");
    }
});

router.put('/CreateConnection/:person2_id', fetchuser, async (req, res) => {
    let success = false;
    const id = req.user.id;
    const person2_id = req.params.person2_id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const person1 = await User.findOne({ _id: new ObjectId(id)});
        const person2 = await User.findOne({ _id: new ObjectId(person2_id)});

        if (!id || !person2_id) {
            return res.status(400).json({ success, error: "Either of the person doesn't exit" });
        }

        const privilegeOfPerson1 = await Codes.findOne({ _id: new ObjectId(person1.privilege_id) });
        const privilegeOfPerson2 = await Codes.findOne({ _id: new ObjectId(person2.privilege_id) });

        const privilegeCodeOfPerson1 = privilegeOfPerson1.code;
        const privilegeCodeOfPerson2 = privilegeOfPerson2.code;

        const privilegeCodeOfConnect = await Codes.findOne({ code: 'Connect' });
        const privilegeCodeOfFollow = await Codes.findOne({ code: 'Follow' });

        if (privilegeCodeOfPerson1 === 'Teacher' && privilegeCodeOfPerson2 === 'Teacher') {
            relationship_id = privilegeCodeOfConnect._id;
        } 
        else if (privilegeCodeOfPerson1 === 'Student' && privilegeCodeOfPerson2 === 'Student') {
            relationship_id = privilegeCodeOfConnect._id;
        } 
        else{
            relationship_id = privilegeCodeOfFollow._id;
        }

        let connections = 0;
        let followers = 0;

        if(relationship_id === privilegeCodeOfFollow._id){
            if(privilegeCodeOfPerson1 === 'Teacher' && privilegeCodeOfPerson2 === 'Student'){
                const connection = await SocialHub.create({
                    person_1_id : id,
                    person_2_id : person2_id,
                    relationship_id : relationship_id,
                    status : "Accepted"
                })

                const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(id)});
                teacherProfile.total_followers += 1;
                await teacherProfile.save();

                followers = teacherProfile.total_followers;
            }
            else{
                const connection = await SocialHub.create({
                    person_1_id : person2_id,
                    person_2_id : id,
                    relationship_id : relationship_id,
                    status : "Accepted"
                })

                const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(person2_id)});
                teacherProfile.total_followers += 1;
                await teacherProfile.save();

            }
        }
        else{
            if(privilegeCodeOfPerson1 === 'Teacher' && privilegeCodeOfPerson2 === 'Teacher'){

                const connection = await SocialHub.create({
                    person_1_id : id,
                    person_2_id : person2_id,
                    relationship_id : relationship_id,
                    status : "Pending"
                })
            }
            else{

                const connection = await SocialHub.create({
                    person_1_id : id,
                    person_2_id : person2_id,
                    relationship_id : relationship_id,
                    status : "Pending"
                })
            }
        }

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while updating connections");
    }
});

module.exports = router