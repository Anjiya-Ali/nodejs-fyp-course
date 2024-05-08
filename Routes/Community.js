//Invite conneted users to COmmunity nai hua hai

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const TeacherProfile = require('../Models/TeacherProfile');

const multer = require('multer');
const Community = require('../Models/Community')
const CommunityPost = require('../Models/CommunityPosts')
const User = require('../Models/User')
const Post = require('../Models/Posts')
const UserPost = require('../Models/UserPosts')
const Comment = require('../Models/Comments')

const fetchuser = require('../Middlewares/fetchuser');

const formatNumber = (number) => {
    if (number < 1000) {
        return number.toString();
    } else if (number < 1000000) {
        return (number / 1000).toFixed(1) + 'K';
    } else {
        return (number / 1000000).toFixed(1) + 'M';
    }
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'Uploads/CommunityCovers';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ dest: 'Uploads/CommunityCovers' });
//Create a Community
//localhost:3000/api/Community/createCommunity
router.post('/createCommunity', fetchuser, upload.single('community_image'), [
    body('community_name', 'Enter a Community Name').isLength({ min: 3 }),

], async (req, res) => {

    const errors = validationResult(req);
    let success = false
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        const creator_user_id = new mongoose.Types.ObjectId(req.user.id);
        const { community_name, community_description } = req.body;
        const members_id = [req.user.id]
        const total_members = 1
        const requested_members_id = []
        const name = await User.findById(
            creator_user_id
        ).select("first_name last_name");

        fs.renameSync(req.file.path, path.join('Uploads', 'CommunityCovers', req.file.originalname));
        const commCover = path.join('Uploads', 'CommunityCovers', req.file.originalname);

        let community = await Community.create({
            creator_user_id,
            community_name,
            community_description,
            community_image: commCover,
            members_id,
            total_members,
            requested_members_id
        });
        if (community) {
            const communityWithAdditionalData = { ...community.toObject(), name: name["first_name"] + ' ' + name["last_name"] };
            success = true;
            return res.json({ success, community: communityWithAdditionalData })
        }

        return res.json({ success, message: "Some error occured while Creating the Community" });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Get All Communities
//localhost:3000/api/allCommunities
router.get('/allCommunities', fetchuser, async (req, res) => {
    try {
        let success = false;
        const communities = await Community.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'creator_user_id',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $project: {
                    community_name: 1,
                    community_image: 1,
                    community_description: 1,
                    total_members: 1,
                    name: {
                        $concat: [
                            { $arrayElemAt: ['$creator.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$creator.last_name', 0] }
                        ]
                    },
                    creator_user_id: 1
                },
            },
        ]);

        if (communities.length === 0) {
            return res.json({ success, message: "No Community hasn't been created yet, be the first one to create a community" });
        }
        success = true
        res.json({ success, communities });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Get a Single Community by CommunityId
//localhost:3000/api/Community/getOne/65366bc1c0cf15278be29098
router.get('/getOne/:communityId/singleCommunity', fetchuser, async (req, res) => {
    let success = false;
    let status = 'Join';

    try {
        const searchId = req.params.communityId;
        const searchUserId = req.user.id;

        // const community = await Community.findById(searchId).select("community_name community_description community_image total_members");
        const community = await Community.findById(searchId);

        if (community) {
            const communityDetail = await Community.findOne({
                _id: searchId,
                $or: [
                    { members_id: { $in: [searchUserId] } },
                    { requested_members_id: { $in: [searchUserId] } }
                ]
            });

            if (communityDetail === null) {
                success = true
                return res.json({ success, status, community });
            }
            if (communityDetail.members_id.length > 0 && communityDetail.members_id.includes(searchUserId)) {
                success = true
                status = "Joined"
                return res.json({ success, status, community });
            } else if (communityDetail.requested_members_id.length > 0 && communityDetail.requested_members_id.includes(searchUserId)) {
                status = 'Pending';
                success = true;
                return res.json({ success, status, community });
            }

        }
        else {
            return res.status(500).send({ success, message: "Such Community doesn't Exists" });
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Get all Joined Communities of a User
//localhost:3000/api/Community/joinedCommunities
router.get('/joinedCommunities', fetchuser, async (req, res) => {
    let success = false
    try {
        const searchId = req.user.id;
        const joinedCommunities = await Community.aggregate([
            {
                $match: {
                    members_id: { $in: [searchId] },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'creator_user_id',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $project: {
                    community_name: 1,
                    community_image: 1,
                    total_members: 1,
                    name: {
                        $concat: [
                            { $arrayElemAt: ['$creator.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$creator.last_name', 0] },
                        ],
                    },
                    creator_user_id: 1
                },
            },
        ]).exec();

        // const joinedCommunities = await Community.find({ members_id: { $in: [searchId] } }).select('community_name community_image');
        success = true
        if (joinedCommunities.length === 0) {
            return res.json({ success, message: "Currently You are Not Part of Any Community" });
        }
        return res.json({ success, joinedCommunities });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Get all Communities of a User which he has requested to Join , Pending commuities
//localhost:3000/api/Community/pendingFCommunities
router.get('/pendingCommunities', fetchuser, async (req, res) => {
    let success = false
    try {
        const searchId = req.user.id;
        const pendingCommunities = await Community.aggregate([
            {
                $match: {
                    requested_members_id: { $in: [searchId] },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'creator_user_id',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $project: {
                    community_name: 1,
                    community_image: 1,
                    total_members: 1,
                    name: {
                        $concat: [
                            { $arrayElemAt: ['$creator.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$creator.last_name', 0] },
                        ],
                    },
                },
            },
        ]).exec();
        if (pendingCommunities.length === 0) {
            return res.json({ success, message: "No Pending Community" });
        }
        success = true
        return res.json({ success, pendingCommunities });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Update Community Details if and only if you are the creator of that community
//localhost:3000/api/Community/updateCommunity/653767f76dad1cf440fb9f99
// router.put('/updateCommunity/:communityId', fetchuser, upload.single('community_image'), [
//     body('community_name', 'Enter a Community Name').isLength({ min: 3 }),

// ], async (req, res) => {
//     const errors = validationResult(req);
//     let success = false
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ success, errors: errors.array() });
//     }
//     try {
//         const searchId = new mongoose.Types.ObjectId(req.user.id);
//         const communityId = new mongoose.Types.ObjectId(req.params.communityId);
//         let updatedCommunity = await Community.find({
//             $and: [
//                 { creator_user_id: searchId },
//                 { _id: communityId }
//             ]
//         });
//         if (updatedCommunity.length > 0) {
//             try {
//                 const { community_name, community_description, community_image } = req.body;
//                 fs.renameSync(req.file.path, path.join('Uploads', 'CommunityCovers', req.file.originalname));
//                 const commCover = path.join('Uploads', 'CommunityCovers', req.file.originalname);

//                 const community = await Community.findOneAndUpdate(
//                     { _id: communityId },
//                     {
//                         $set: {
//                             community_name,
//                             community_description,
//                             community_image: commCover
//                         }
//                     },
//                     { new: true }
//                 );
//                 success = true;
//                 return res.json({ success, community })
//             }

//             catch (error) {
//                 console.error(error.message);
//                 return res.json(500).send({ success, message: "Some error occured in Updating Community" });
//             }
//         }
//         else {
//             return res.json({ success, message: "Community cant be Updated" });
//         }
//     }

//     catch (error) {
//         console.error(error.message);
//         return res.status(500).send({ success, message: "Some error occured in Updating Community" });
//     }
// });
router.put('/updateCommunity/:communityId', fetchuser, upload.single('community_image'), [
    body('community_name', 'Enter a Community Name').isLength({ min: 3 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        const searchId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);

        let updatedCommunity = await Community.find({
            $and: [
                { creator_user_id: searchId },
                { _id: communityId }
            ]
        });

        if (updatedCommunity.length > 0) {
            try {
                const { community_name, community_description } = req.body;
                let commCover;

                if (req.file) {
                    fs.renameSync(req.file.path, path.join('Uploads', 'CommunityCovers', req.file.originalname));
                    commCover = path.join('Uploads', 'CommunityCovers', req.file.originalname);
                }

                const community = await Community.findOneAndUpdate(
                    { _id: communityId },
                    {
                        $set: {
                            community_name,
                            community_description,
                            ...(commCover && { community_image: commCover }) // Only include if commCover exists
                        }
                    },
                    { new: true }
                );

                success = true;
                return res.json({ success, community });
            } catch (error) {
                console.error(error.message);
                return res.status(500).send({ success, message: "Some error occurred in Updating Community" });
            }
        } else {
            return res.json({ success, message: "Community can't be Updated" });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).send({ success, message: "Some error occurred in Updating Community" });
    }
});

//Delete Community if and only if you are the owner of that community
//localhost:3000/api/Community/deleteCommunity/653767f76dad1cf440fb9f99
router.delete('/deleteCommunity/:communityId', fetchuser, async (req, res) => {
    let success = false;
    try {
        const searchId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);

        const deleteCommunity = await Community.deleteOne({
            $and: [
                { creator_user_id: searchId },
                { _id: communityId }
            ]
        });

        const postIds = await CommunityPost.distinct('post_id', { community_id: communityId });
        await CommunityPost.deleteMany({ community_id: communityId });
        await Post.deleteMany({ _id: { $in: postIds.map(id => (id)) } });
        await Comment.deleteMany({ post_id: { $in: postIds.map(id => (id)) } });
        await UserPost.deleteMany({ post_id: { $in: postIds.map(id => (id)) } });

        if (deleteCommunity.deletedCount > 0) {
            success = true;
            return res.json({ success, message: "Community has been Deleted" });
        } else {
            return res.json({ success, message: "Community cannot be Deleted" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Delete a member of Community if and only if you are the owner of that community
//localhost:3000/api/Community/getOne/653767f76dad1cf440fb9f99/removeMember/653767f76dad1cf440fb9f99
router.put('/getOne/:communityId/removeMember/:memberId', fetchuser, async (req, res) => {
    let success = false;
    try {
        const searchId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);
        const memberId = req.params.memberId;
        if (req.user.id === memberId) {
            return res.status(500).send({ success, message: "Creator Cannot Leave" });
        }
        const removeMember = await Community.updateOne(
            {
                $and: [
                    { creator_user_id: searchId },
                    { _id: communityId },
                    { members_id: { $in: [memberId] } }
                ]
            },
            {
                $pull: { members_id: memberId },
                $inc: { total_members: -1 }
            }
        );

        if (removeMember.modifiedCount > 0) {
            success = true
            return res.json({ success, message: "The Member has been removed sucessfully from the community." });
        }
        else {
            return res.status(500).send({ success, message: "You are not part of Community" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

router.put('/getOne/:communityId/removeMyself/:memberId', fetchuser, async (req, res) => {
    let success = false;
    try {
        const searchId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);
        const memberId = req.params.memberId;
        if (req.user.id === memberId) {
            const removeMember = await Community.updateOne(
                {
                    $and: [
                        { creator_user_id: { $ne: searchId } },
                        { _id: communityId },
                        { members_id: { $in: [memberId] } }
                    ]
                },
                {
                    $pull: { members_id: memberId },
                    $inc: { total_members: -1 }

                }
            );
            if (removeMember.modifiedCount > 0) {
                success = true
                return res.json({ success, message: "You have been removed sucessfully from the community." });
            }
            else {
                success = true
                return res.json({ success, message: "Error Removing you from the Commmunity" });
            }
        }
        return res.status(500).send({ success, message: "You are not part of Community" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Requesting to join the Community
//localhost:3000/api/Community/getOne/653767f76dad1cf440fb9f99/requestToJoin
router.put('/getOne/:communityId/requestToJoin', fetchuser, async (req, res) => {
    let success = false;
    try {
        const searchUserId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);

        const communityDetail = await Community.findOne({
            _id: communityId,
            $or: [
                { members_id: { $in: [searchUserId] } },
                { requested_members_id: { $in: [searchUserId] } }
            ]
        });

        if (!communityDetail) {
            const requestedMemberInsertion = await Community.findByIdAndUpdate(
                communityId,
                {
                    $push: { requested_members_id: searchUserId }
                },
                { new: true }
            );

            if (requestedMemberInsertion) {
                success = true;
                return res.json({ success, message: "You have requested to join the community. Wait until the creator accepts your request to join." });
            } else {
                return res.json({ success, message: "Some error occurred in requesting to join the community." });
            }
        } else {
            if (communityDetail.members_id.length > 0) {
                return res.json({ success, message: "You are already part of the community." });
            } else if (communityDetail.requested_members_id.length > 0) {
                return res.json({ success, message: "You have already requested to join the community." });
            }
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//Accepting an already requested user and letting to join the community (requested_memebers_id->memebers_Id)
//localhost:3000/api/Community/getOne/653767f76dad1cf440fb9f99/acceptRequest/
router.put('/getOne/:communityId/acceptRequest/:requestedMemberId', fetchuser, async (req, res) => {
    let success = false;
    try {
        const creatorId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);
        const requestedMemberId = req.params.requestedMemberId;

        const communityDetail = await Community.findOne({
            _id: communityId,
            creator_user_id: creatorId,
            requested_members_id: { $in: [requestedMemberId] },
            members_id: { $nin: [requestedMemberId] },

        });
        if (communityDetail) {
            const memberInsertion = await Community.findByIdAndUpdate(
                communityId,
                {
                    $pull: { requested_members_id: requestedMemberId },
                    $push: { members_id: requestedMemberId },
                    $inc: { total_members: 1 }

                }
            );
            if (memberInsertion) {
                success = true;
                return res.json({ success, message: "The Requested Member has sucessfully joined the community." });
            } else {
                return res.json({ success, message: "Some error occurred in letting the requested member for joining." });
            }
        } else {
            return res.status(500).send({ success, message: "Some Error Occured in making the user as a member ." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

//If you are a member of the community then only you can see the members of the community
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/allMembers
router.get('/getOne/:communityId/allMembers', fetchuser, async (req, res) => {
    try {
        let success = false;
        const memberId = req.user.id;
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);

        const memberCommunity = await Community.findOne(
            {
                _id: communityId,
                members_id: { $in: [memberId] }
            }
        ).select("members_id");

        if (memberCommunity) {
            const memberIds = memberCommunity.members_id.map(memberId => new mongoose.Types.ObjectId(memberId));
            // const membersInfo = await User.find({ _id: { $in: memberIds } }).select("_id first_name last_name");
            const membersInfo = await User.aggregate([
                {
                    $match: {
                        _id: { $in: memberIds }
                    }
                },
                {
                    $lookup: {
                        from: "studentprofiles",  // Adjust the collection name as needed
                        localField: "_id",
                        foreignField: "student_profile_id",
                        as: "studentProfile"
                    }
                },
                {
                    $lookup: {
                        from: "teacherprofile",  // Adjust the collection name as needed
                        localField: "_id",
                        foreignField: "teacher_profile_id",
                        as: "teacherProfile"
                    }
                },
                {
                    $addFields: {
                        bio_information: {
                            $cond: {
                                if: { $gt: [{ $size: "$studentProfile" }, 0] },
                                then: "$studentProfile.bio_information",
                                else: {
                                    $cond: {
                                        if: { $gt: [{ $size: "$teacherProfile" }, 0] },
                                        then: "$teacherProfile.bio_information",
                                        else: null
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        bio_information: 1
                    }
                }
            ]);

            if (membersInfo) {
                success = true;
                return res.json({ success, members: membersInfo });
            }
        }
        return res.status(500).json({ success, message: "Some error occurred in fetching all members of the community" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

router.get('/getOne/:communityId/pendingMembers', fetchuser, async (req, res) => {
    try {
        let success = false;
        const memberId = req.user.id;
        const communityId = new mongoose.Types.ObjectId(req.params.communityId);

        const memberCommunity = await Community.findOne(
            {
                _id: communityId,
                members_id: { $in: [memberId] }
            }
        ).select("requested_members_id");

        if (memberCommunity) {
            const memberIds = memberCommunity.requested_members_id.map(memberId => new mongoose.Types.ObjectId(memberId));
            // const membersInfo = await User.find({ _id: { $in: memberIds } }).select("_id first_name last_name");
            const membersInfo = await User.aggregate([
                {
                    $match: {
                        _id: { $in: memberIds }
                    }
                },
                {
                    $lookup: {
                        from: "studentprofiles",  // Adjust the collection name as needed
                        localField: "_id",
                        foreignField: "student_profile_id",
                        as: "studentProfile"
                    }
                },
                {
                    $lookup: {
                        from: "teacherprofile",  // Adjust the collection name as needed
                        localField: "_id",
                        foreignField: "teacher_profile_id",
                        as: "teacherProfile"
                    }
                },
                {
                    $addFields: {
                        bio_information: {
                            $cond: {
                                if: { $gt: [{ $size: "$studentProfile" }, 0] },
                                then: "$studentProfile.bio_information",
                                else: {
                                    $cond: {
                                        if: { $gt: [{ $size: "$teacherProfile" }, 0] },
                                        then: "$teacherProfile.bio_information",
                                        else: null
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        bio_information: 1
                    }
                }
            ]);

            if (membersInfo) {
                success = true;
                return res.json({ success, members: membersInfo });
            }
        }
        return res.json({ success, members: [] });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }  

});

module.exports = router