const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const Community = require('../Models/Community')
const Post = require('../Models/Posts')
const CommunityPost = require('../Models/CommunityPosts')
const UserPost = require('../Models/UserPosts')
const User = require('../Models/User')
const Comment = require('../Models/Comments')
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const checkCommunityPost = require('../Middlewares/checkCommunityPost')

const upload = multer({ dest: 'Uploads/CommunityPosts' });
//Create a post in community only if the community exists and you are member of the community
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/createCommunityPost
router.post('/createCommunityPost', upload.array('file_attachments'), [
    body('description', 'Enter Description').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        console.log("Asfsgsd")
        const memberId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.communityId);
        const { description } = req.body;
        const file_attachments = req.files.map(file => {

            fs.renameSync(file.path, path.join('Uploads', 'CommunityPosts', file.originalname));
            return path.join('Uploads', 'CommunityPosts', file.originalname);
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

            const communityPost = await CommunityPost.create({
                community_id: communityId,
                post_id,
            });

            if (userPost && communityPost) {
                success = true;
                return res.json({ success, post, userPost });
            }
        }

        return res.status(500).json({ success, message: "Some error occurred in creating Post in the Community" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in creating Post in the Community");
    }
});

//Create a post in community only if the community exists and you are member of the community
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/allPosts
router.get('/allPosts', async (req, res) => {
    let success = false;
    try {
        const communityId = new mongoose.Types.ObjectId(req.communityId);

        let posts = await CommunityPost.find({ community_id: communityId })
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
        // --------------
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

        // ---------------
        const userPosts = await UserPost.find({ post_id: { $in: postIds } })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'first_name last_name', // select only the 'first_name' field from the User model
            })
            .exec();
        const postsWithNames = posts.map(post => {
            const userPost = userPosts.find(userPost => String(userPost.post_id) === String(post.post_id._id));
            const commentsCountForPost = commentsCountMap.get(String(post.post_id._id)) || 0;

            if (userPost) {
                return {
                    ...post.toObject(), name: userPost.user_id.first_name + ' ' + userPost.user_id.last_name, poster: userPost.user_id._id, commentsCount: commentsCountForPost
                };
            }

            return post.toObject();
        });

        success = true
        postsWithNames.sort((a, b) => new Date(b.post_id.date) - new Date(a.post_id.date));

        return res.json({ success, posts: postsWithNames });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in fetching Posts in the Community");
    }
});

//Update a Post you have previously created in the Community
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/updatePost/653a2482efe81ef88c2b42a3
// router.put('/updatePost/:postId', checkCommunityPost, [
//     body('description', 'Enter Description').isLength({ min: 5 }),
// ], async (req, res) => {
//     const errors = validationResult(req);
//     let success = false;

//     if (!errors.isEmpty()) {
//         return res.status(400).json({ success, errors: errors.array() });
//     }
//     try {

//         const postId = new mongoose.Types.ObjectId(req.params.postId);
//         const userId = new mongoose.Types.ObjectId(req.user.id);

//         const userPost = await UserPost.findOne(
//             {
//                 post_id: postId,
//                 user_id: userId
//             }
//         )
//         if (userPost) {
//             const { description } = req.body;
//             const posts = await Post.findByIdAndUpdate(
//                 postId,
//                 {
//                     $set: {
//                         description: description
//                     }
//                 },
//                 { new: true }
//             );
//             if (!posts) {
//                 return res.json({ success, message: "Error Updating the Post" });
//             }
//             success = true
//             return res.json({ success, userPost });
//         }
//         return res.json({ success, message: "You are not the creator of this Post" });
//     }
//     catch (error) {
//         console.error(error.message);
//         res.status(500).send("Some error occurred in creating Post in the Community");
//     }
// });
router.put('/updatePost/:postId', checkCommunityPost, [
    body('description', 'Enter Description').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {

        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const userPost = await UserPost.findOne(
            {
                post_id: postId,
                user_id: userId
            }
        )
        if (userPost) {
            const { description } = req.body;
            const posts = await Post.findByIdAndUpdate(
                postId,
                {
                    $set: {
                        description: description,
                    }
                },
                { new: true }
            );
            if (!posts) {
                return res.json({ success, message: "Error Updating the Post" });
            }
            success = true
            return res.json({ success, userPost });
        }
        return res.json({ success, message: "You are not the creator of this Post" });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in creating Post in the Community");
    }
});
//delete a post if you are the creator of the community or you have created that post
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/deletePost/653a2482efe81ef88c2b42a3
router.delete('/deletePost/:postId', checkCommunityPost, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const communityId = new mongoose.Types.ObjectId(req.communityId);
        const postId = new mongoose.Types.ObjectId(req.params.postId);

        const creatorCommunity = await Community.findOne({
            _id: communityId,
            creator_user_id: userId
        });

        const userPost = await UserPost.findOne({
            post_id: postId,
            user_id: userId
        });

        if (creatorCommunity || userPost) {
            const deletedCommunityPost = await CommunityPost.deleteOne({
                post_id: postId,
                community_id: communityId
            });

            const deletedUserPost = await UserPost.deleteOne({
                post_id: postId,
                user_id: userId
            });

            const deletedPost = await Post.findByIdAndDelete(postId);
            const deletedComments = await Comment.deleteMany({ post_id: postId });
            if (deletedCommunityPost.deletedCount > 0 && deletedUserPost.deletedCount > 0 && deletedPost) {
                return res.json({ success: true, message: "You have successfully deleted the post" });
            } else {
                return res.status(500).json({ success: false, message: "Failed to delete the post" });
            }
        } else {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this post" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while processing the request");
    }
});

//Like a community post and if already liked your like would be removed
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653a7827dc0ed2caf86c47e7/updateLike
router.put('/updateLike/:postId', checkCommunityPost, async (req, res) => {
    let success = false;
    try {
        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const likeMember = req.user.id;

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

        return res.status(500).send("Unable to update your like on the Community Post");
    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

//Liked members of a community post to see how many and who likes the specific community post
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653a7827dc0ed2caf86c47e7/likeMembers
router.get('/likeMembers/:postId', checkCommunityPost, async (req, res) => {
    let success = false;
    try {
        const postId = new mongoose.Types.ObjectId(req.params.postId);

        const post = await Post.findOne({
            _id: postId
        }).select("like_members");
        if (post.like_members.length === 0) {
            return res.json({ success, message: "No Likes on this Community Post" });
        }
        else if (post.like_members.length > 0) {
            const memberIds = post.like_members.map(memberId => new mongoose.Types.ObjectId(memberId));
            const membersLiked = await User.find({ _id: { $in: memberIds } }).select("_id first_name last_name");
            if (membersLiked) {
                success = true;
                return res.json({ success, membersLiked });
            }

            return res.status(500).send("Unable to Fetch liked member list on the Community Post");
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

module.exports = router