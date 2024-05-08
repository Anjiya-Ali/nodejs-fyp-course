const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const Post = require('../Models/Posts')
const UserPost = require('../Models/UserPosts')
const User = require('../Models/User')
const Comment = require('../Models/Comments');
const CommunityPost = require('../Models/CommunityPosts');
const Community = require('../Models/Community');
const StudentProfile = require('../Models/StudentProfile');
const TeacherProfile = require('../Models/TeacherProfile');

const SocialHub = require('../Models/SocialHub');

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const checkUserPost = require('../Middlewares/checkUserPost')
const checkNotCommunityPost = require('../Middlewares/checkNotCommunityPost');
async function getProfilePicture(privilege, userId) {
    if (privilege === 'Student') {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: userId });
        return studentProfile ? studentProfile.profile_picture : null;
    } else if (privilege === 'Teacher') {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: userId });
        return teacherProfile ? teacherProfile.profile_picture : null;
    }

    return null;
}
const upload = multer({ dest: 'Uploads/Posts' });

router.post('/createPost', upload.array('file_attachments'), [
    body('description', 'Enter Description').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        const memberId = new mongoose.Types.ObjectId(req.user.id);
        const { description } = req.body;
        const file_attachments = req.files.map(file => {

            fs.renameSync(file.path, path.join('Uploads', 'Posts', file.originalname));
            return path.join('Uploads', 'Posts', file.originalname);
        });
        const post = await Post.create({
            description,
            file_attachments: file_attachments
        });

        if (post) {
            const post_id = post._id;

            const userPost = await UserPost.create({
                user_id: memberId,
                post_id,
            });


            if (userPost) {
                success = true;
                return res.json({ success, post, userPost });
            }
        }

        return res.status(500).json({ success, message: "Some error occurred in creating you Personal Post" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in processing the request");
    }
});

//Create a post in community only if the community exists and you are member of the community
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/allPosts
// router.get('/myAllPosts', async (req, res) => {
//     let success = false;

//     try {
//         const memberId = new mongoose.Types.ObjectId(req.user.id);
//         const postIdsInUserPost = await UserPost.distinct('post_id', { user_id: memberId });
//         const postIdsInCommunityPost = await CommunityPost.distinct('post_id');
//         const resultant = postIdsInCommunityPost.map(id => id.toString());
//         const resultantArray = postIdsInUserPost.filter(element => !resultant.includes(element.toString()));
//         const posts = await Post.find({ _id: { $in: resultantArray } });

//         if (!posts) {
//             return res.json({ success, message: "You haven't posted for Yourself" });
//         }
//         else {
//             success = true
//             return res.json({ success, posts });
//         }

//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send("Some error occurred in processing the request");
//     }
// });
router.get('/myAllPosts', async (req, res) => {
    let success = false;

    try {
        const memberId = new mongoose.Types.ObjectId(req.user.id);
        const postIdsInUserPost = await UserPost.distinct('post_id', { user_id: memberId });
        const postIdsInCommunityPost = await CommunityPost.distinct('post_id');
        const resultant = postIdsInCommunityPost.map(id => id.toString());
        const resultantArray = postIdsInUserPost.filter(element => !resultant.includes(element.toString()));
        const posts = await Post.find({ _id: { $in: resultantArray } });

        if (!posts) {
            return res.json({ success, message: "You haven't posted for Yourself" });
        } else {
            // Populate user information for each post
            const userPosts = await UserPost.find({ post_id: { $in: resultantArray } })
                .populate({
                    path: 'user_id',
                    model: 'User',
                    select: '_id first_name last_name privilege_id', // select fields from the User model
                })
                .exec();
            const commentsCount = await Comment.aggregate([
                {
                    $match: { post_id: { $in: resultantArray } }
                },
                {
                    $group: {
                        _id: "$post_id",
                        count: { $sum: 1 }
                    }
                }
            ]);
            const commentsCountMap = new Map(commentsCount.map(item => [String(item._id), item.count]));

            // Append user information to each post
            const postsWithUserInfo = posts.map(post => {
                const userPost = userPosts.find(userPost => String(userPost.post_id) === String(post._id));
                const commentsCountForPost = commentsCountMap.get(String(post._id)) || 0;

                if (userPost) {
                    return {
                        ...post.toObject(),
                        poster: userPost.user_id._id,
                        name: userPost.user_id.first_name + " " + userPost.user_id.last_name,
                        commentsCount: commentsCountForPost
                    };
                }

                return post.toObject();
            });

            success = true;
            postsWithUserInfo.sort((a, b) => new Date(b.date) - new Date(a.date));

            return res.json({ success, posts: postsWithUserInfo });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in processing the request");
    }
});
router.get('/feed', async (req, res) => {
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

        const communityIds = joinedCommunities.map(community => new mongoose.Types.ObjectId(community._id));

        let posts = await CommunityPost.find({ community_id: { $in: communityIds } })
            .populate({
                path: 'post_id',
                model: 'Posts'
            })
            .sort({ 'post_id.date': -1 })
            .exec();

        if (posts.length === 0) {
            return res.json({ success, message: "No Posts in the Community" });
        }

        const postIds = posts.map(post => post.post_id._id);
        const commentsCount = await Comment.aggregate([
            {
                $match: { post_id: { $in: postIds } }
            },
            {
                $group: {
                    _id: "$post_id",
                    count: { $sum: 1 }
                }
            }
        ]);

        const commentsCountMap = new Map(commentsCount.map(item => [String(item._id), item.count]));

        const userPosts = await UserPost.find({ post_id: { $in: postIds } })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'first_name last_name',
            })
            .exec();

        const postsWithNames = posts.map(post => {
            const userPost = userPosts.find(userPost => String(userPost.post_id) === String(post.post_id._id));
            const community = joinedCommunities.find(community => String(community._id) === String(post.community_id));
            const commentsCountForPost = commentsCountMap.get(String(post.post_id._id)) || 0;

            if (userPost && community) {
                return {
                    ...post.toObject(), name: userPost.user_id.first_name + ' ' + userPost.user_id.last_name, poster: userPost.user_id._id, community_name: community.community_name, commentsCount: commentsCountForPost, community_image: community.community_image, creator_user_id: community.creator_user_id,
                };
            }

            return post.toObject();
        });

        success = true;
        postsWithNames.sort((a, b) => new Date(b.post_id.date) - new Date(a.post_id.date));
        const searcher = req.user.id;
        const realUser = new mongoose.Types.ObjectId(searcher);
        const stringer = "65350d4002f1f4014d2b7a07";
        const relId = new mongoose.Types.ObjectId(stringer);

        var resu;
        const resulter = await TeacherProfile.findOne({ teacher_profile_id: realUser });
        if (resulter) {
            resu = await SocialHub.find({
                $and: [
                    {
                        $or: [
                            { person_1_id: searcher },
                            { person_2_id: searcher }
                        ]
                    },
                    { status: 'Accepted' },
                    { relationship_id: relId }
                ]
            });
        } else {
            resu = await SocialHub.find({
                $and: [
                    {
                        $or: [
                            { person_1_id: searcher },
                            { person_2_id: searcher }
                        ]
                    },
                    { status: 'Accepted' },
                ]
            });
        }

        var arr = [realUser];
        for (var i = 0; i < resu.length; i++) {
            if (resu[i].person_1_id != searcher) {
                arr.push(resu[i].person_1_id);
            }
            if (resu[i].person_2_id != searcher) {
                arr.push(resu[i].person_2_id);
            }
        }
        const userPostsOrg = await UserPost.find({ user_id: { $in: arr } });
        const postIdsOrg = userPostsOrg.map(obj => obj.post_id);
        const existingPostIds = await CommunityPost.find({}).distinct('post_id');


        const final = [];

        var postsWithNamesOrg = [];
        var appendedArray = [];
        for (let i = 0; i < postIdsOrg.length; i++) {
            let postId = postIdsOrg[i];
            if (!existingPostIds.some(existingId => existingId.equals(postId))) {
                final.push(postId);
            }
        }
        if (final.length > 0) {
            const resultOrg = await Post.aggregate([
                {
                    $match: {
                        _id: { $in: final }
                    },
                },
                {
                    $sort: { Date: -1 }
                }
            ]);
            const names = await User.find({ _id: { $in: arr } }).select("first_name last_name")

            const commentsCountOrg = await Comment.aggregate([
                {
                    $match: { post_id: { $in: final } }
                },
                {
                    $group: {
                        _id: "$post_id",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const commentsCountMapOrg = new Map(commentsCountOrg.map(item => [String(item._id), item.count]));

            for (var i = 0; i < final.length; i++) {
                const foundDocument = userPostsOrg.find(obj => obj.post_id.equals(resultOrg[i]._id));
                const foundUser = names.find(obj => obj._id.equals(foundDocument.user_id));

                const commentsCounter = commentsCountMapOrg.get(String(resultOrg[i]._id)) || 0;
                postsWithNamesOrg.push(
                    {
                        post_id: resultOrg[i],
                        commentsCount: commentsCounter,
                        name: foundUser.first_name + ' ' + foundUser.last_name,
                        poster: foundUser._id
                    }
                )
            }

            appendedArray = postsWithNames.concat(postsWithNamesOrg);
            appendedArray.sort((a, b) => b.post_id.date - a.post_id.date);
           
        }

        return res.json({ success, posts: postsWithNamesOrg.length == 0 ? postsWithNames : appendedArray });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured while processing the request");
    }
});

// router.get('/feed', async (req, res) => {
//     let success = false
//     try {
//         const searchId = req.user.id;
//         const joinedCommunities = await Community.aggregate([
//             {
//                 $match: {
//                     members_id: { $in: [searchId] },
//                 },
//             },
//             {
//                 $lookup: {
//                     from: 'users',
//                     localField: 'creator_user_id',
//                     foreignField: '_id',
//                     as: 'creator',
//                 },
//             },
//             {
//                 $project: {
//                     community_name: 1,
//                     community_image: 1,
//                     total_members: 1,
//                     name: {
//                         $concat: [
//                             { $arrayElemAt: ['$creator.first_name', 0] },
//                             ' ',
//                             { $arrayElemAt: ['$creator.last_name', 0] },
//                         ],
//                     },
//                     creator_user_id: 1
//                 },
//             },
//         ]).exec();

//         // const joinedCommunities = await Community.find({ members_id: { $in: [searchId] } }).select('community_name community_image');
//         success = true
//         if (joinedCommunities.length === 0) {
//             return res.json({ success, message: "Currently You are Not Part of Any Community" });
//         }

//         const communityIds = joinedCommunities.map(community => new mongoose.Types.ObjectId(community._id));

//         let posts = await CommunityPost.find({ community_id: { $in: communityIds } })
//             .populate({
//                 path: 'post_id',
//                 model: 'Posts'
//             })
//             .sort({ 'post_id.date': -1 })
//             .exec();

//         if (posts.length === 0) {
//             return res.json({ success, message: "No Posts in the Community" });
//         }

//         const postIds = posts.map(post => post.post_id._id);
//         const commentsCount = await Comment.aggregate([
//             {
//                 $match: { post_id: { $in: postIds } }
//             },
//             {
//                 $group: {
//                     _id: "$post_id",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         const commentsCountMap = new Map(commentsCount.map(item => [String(item._id), item.count]));

//         const userPosts = await UserPost.find({ post_id: { $in: postIds } })
//             .populate({
//                 path: 'user_id',
//                 model: 'User',
//                 select: 'first_name last_name privilegeId',
//             })
//             .exec();


//         const postsWithNames = await Promise.all(posts.map(async (post) => {
//             const userPost = userPosts.find(userPost => String(userPost.post_id) === String(post.post_id._id));
//             const community = joinedCommunities.find(community => String(community._id) === String(post.community_id));
//             const commentsCountForPost = commentsCountMap.get(String(post.post_id._id)) || 0;

//             if (userPost && community) {
//                 const { first_name, last_name, _id: posterId, privilegeId } = userPost.user_id;
//                 const profile_picture = await getProfilePicture(privilegeId, posterId);

//                 return {
//                     ...post.toObject(), name: userPost.user_id.first_name + ' ' + userPost.user_id.last_name, poster: userPost.user_id._id, community_name: community.community_name, commentsCount: commentsCountForPost, community_image: community.community_image, creator_user_id: community.creator_user_id, profile_picture
//                 };
//             }

//             return post.toObject();
//         }));

//         success = true;
//         postsWithNames.sort((a, b) => new Date(b.post_id.date) - new Date(a.post_id.date));
//         return res.json({ success, posts: postsWithNames });
//     }
//     catch (error) {
//         console.error(error.message);
//         res.status(500).send("Some error occured while processing the request");
//     }
// });


//Update a Post you have previously created in the Community
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/updatePost/653a2482efe81ef88c2b42a3
router.put('/updatePost/:postId', checkUserPost, checkNotCommunityPost, [
    body('description', 'Enter Description').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {

        const { description } = req.body;
        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const notACommunityPost = await CommunityPost.findOne({ post_id: postId })
        if (!notACommunityPost) {
            const posts = await Post.findByIdAndUpdate(
                postId,
                {
                    $set: {
                        description: description
                    }
                },
                { new: true }
            );
            if (!posts) {
                return res.json({ success, message: "Error Updating the Post" });
            }
            success = true
            return res.json({ success, posts });
        }
        else {

            return res.json({ success, message: "Cannot Update the Community Post here" });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in pocessing the request");
    }
});

router.delete('/deletePost/:postId', checkUserPost, checkNotCommunityPost, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const notACommunityPost = await CommunityPost.findOne({ post_id: postId })
        if (!notACommunityPost) {
            const deletedUserPost = await UserPost.deleteOne({
                post_id: postId,
                user_id: userId
            });
            const deletedPost = await Post.findByIdAndDelete(postId);
            const deletedComments = await Comment.deleteMany({ post_id: postId });
            if (deletedPost) {
                return res.json({ success: true, message: "You have successfully deleted the post" });
            } else {
                return res.status(500).json({ success: false, message: "Failed to delete the post" });
            }
        }
        else {

            return res.json({ success, message: "Cannot Delete the Community Post here" });
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while processing the request");
    }
});

//communit wale mein yay dalke ana hai k wocommunity ka member hi hai na
router.put('/updateLike/:postId', checkNotCommunityPost, async (req, res) => {
    let success = false;
    try {
        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const likeMember = req.user.id;
        const notACommunityPost = await CommunityPost.findOne({ post_id: postId })
        if (!notACommunityPost) {
            const post = await Post.findOne({
                _id: postId,
                like_members: { $in: [likeMember] }
            });
            if (post) {
                const updatedPost = await Post.findByIdAndUpdate(
                    postId,
                    {
                        $inc: { total_likes: -1 },
                        $pull: { like_members: likeMember },
                    },
                    { new: true }
                );

                if (updatedPost) {
                    success = true;
                    return res.json({ success, updatedPost });
                }
            } else {
                const updatedPost = await Post.findByIdAndUpdate(
                    postId,
                    {
                        $inc: { total_likes: 1 },
                        $push: { like_members: likeMember },
                    },
                    { new: true }
                );

                if (updatedPost) {
                    success = true;
                    return res.json({ success, updatedPost });
                }
            }

            return res.status(500).send("Unable to update your like on the Post");

        }
        else {
            return res.json({ success, message: "Cannot update the Community Post here" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

router.get('/likeMembers/:postId', checkNotCommunityPost, async (req, res) => {
    let success = false;
    try {
        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const notACommunityPost = await CommunityPost.findOne({ post_id: postId })
        if (!notACommunityPost) {
            const post = await Post.findOne({
                _id: postId
            }).select("like_members");
            if (post.like_members.length === 0) {
                return res.json({ success, message: "No Likes on this Post" });
            }
            else if (post.like_members.length > 0) {
                const memberIds = post.like_members.map(memberId => new mongoose.Types.ObjectId(memberId));
                const membersLiked = await User.find({ _id: { $in: memberIds } }).select("_id first_name last_name");
                if (membersLiked) {
                    success = true;
                    return res.json({ success, membersLiked });
                }

                return res.status(500).send("Unable to Fetch liked member list on the Post");
            }
        }
        else {

            return res.json({ success, message: "Cannot Get the Community Post here" });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

module.exports = router