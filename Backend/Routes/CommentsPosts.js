//req.postId
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const User = require('../Models/User')
const Comment = require('../Models/Comments')

const checkComment = require('../Middlewares/checkComment')

const deleteCommentAndDescendants = async (commentId) => {
    try {
        await Comment.findByIdAndDelete(commentId);
        const descendants = await Comment.find({ parent_comment: commentId });

        for (const descendant of descendants) {
            await deleteCommentAndDescendants(descendant._id);
        }
    } catch (error) {
        console.error(error);
        throw new Error("Error deleting comment and its descendants");
    }
};

//create a comment on a commnity post if you are the member of the community
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post//createComment
router.post('/createComment',
    [
        body('description', 'Enter a Comment').isLength({ min: 1 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        let success = false;

        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }

        try {
            const postId = new mongoose.Types.ObjectId(req.postId);
            const { description } = req.body;
            commentorId = new mongoose.Types.ObjectId(req.user.id);
            const commentorName = await User.findById(commentorId).select("first_name last_name");
            const comment = await Comment.create({
                description,
                post_id: postId,
                commentor_id: req.user.id,
                commentor_name: commentorName.first_name + " " + commentorName.last_name
            });
            if (comment && commentorName) {
                success = true;
                return res.json({ success, comment });
            }

            return res.status(500).send("Unable to create a comment on the Post");
        } catch (error) {
            console.error(error);
            return res.status(500).send("Some error occurred while processing the request");
        }
    }
);

//reply to a comment and make a linkedlist of comments
// localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653baedac957a0dad44d34a4/createCommentReply/653bb4353b6abc7cfcfd361f
router.post('/createCommentReply/:commentId', checkComment, [
    body('description', 'Enter a Comment Reply').isLength({ min: 1 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        const postId = new mongoose.Types.ObjectId(req.postId);
        const commentId = req.params.commentId;
        const commentorId = new mongoose.Types.ObjectId(req.user.id);
        const { description } = req.body;
        const commentorName = await User.findById(commentorId).select("first_name last_name");
        const repliedComment = await Comment.create({
            description,
            post_id: postId,
            parent_comment: commentId,
            commentor_id: req.user.id,
            commentor_name: commentorName.first_name + " " + commentorName.last_name
        });
        if (repliedComment && commentorName) {
            success = true;
            return res.json({ success, repliedComment });
        }


        return res.status(500).send("Unable to reply a comment on the Post");

    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
}
);

//get all comments is a hierarchical manner parent comment, childocmment, child child comment and so on see response for details
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653bc21bac5b8c1a425f09e8/getAllComments
router.get('/getAllComments', async (req, res) => {
    let success = false;
    try {
        const getCommentsInOrder = async (postId, parentId = null) => {
            const comments = await Comment.find({ post_id: postId, parent_comment: parentId });
            const result = [];

            for (const comment of comments) {
                const childComments = await getCommentsInOrder(postId, comment._id);
                result.push({
                    comment,
                    childComments,
                });
            }

            return result;
        };

        const postId = new mongoose.Types.ObjectId(req.postId);
        getCommentsInOrder(postId)
            .then((commentsInOrder) => {
                success = true
                return res.json({ success, commentsInOrder })
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

router.put('/likeComment/:commentId', checkComment, async (req, res) => {
    let success = false;
    try {
        const commentId = new mongoose.Types.ObjectId(req.params.commentId);
        const likeMember = req.user.id;

        const comment = await Comment.findOne({
            _id: commentId,
            like_members: { $in: [likeMember] }
        });
        if (comment) {
            const updatedComment = await Comment.findByIdAndUpdate(
                commentId,
                {
                    $inc: { total_likes: -1 },
                    $pull: { like_members: likeMember },
                },
                { new: true }
            );

            if (updatedComment) {
                success = true;
                return res.json({ success, updatedComment });
            }
        } else {
            const updatedComment = await Comment.findByIdAndUpdate(
                commentId,
                {
                    $inc: { total_likes: 1 },
                    $push: { like_members: likeMember },
                },
                { new: true }
            );

            if (updatedComment) {
                success = true;
                return res.json({ success, updatedComment });
            }
        }

        return res.status(500).send("Unable to update your like on the Comment");
    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

//Delete a comment of a community post and its descendants if you are creator of commnity or creator of comment
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653bc21bac5b8c1a425f09e8/deleteComment/653cc93a470a8802640c6649
router.delete('/deleteComment/:commentId', checkComment, async (req, res) => {

    try {
        const commentId = new mongoose.Types.ObjectId(req.params.commentId);
        const postId = new mongoose.Types.ObjectId(req.postId);
        const commentorId = req.user.id;

        const comment = await Comment.findOne({
            _id: commentId,
            post_id: postId,
            commentor_id: commentorId
        });

        if (!comment) {
            return res.status(500).json({ success: true, message: "Comment and its descendants cannot be deleted" });
        } else {
            await deleteCommentAndDescendants(commentId);
            return res.json({ success: true, message: "Comment and its descendants deleted successfully" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

//Fetch the List of Members who liked the Comments
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653bc21bac5b8c1a425f09e8/Comment/653cc7ea470a8802640c6637/likeMembers
router.get('/likeMembers/:commentId', checkComment, async (req, res) => {
    let success = false;
    try {
        const commentId = new mongoose.Types.ObjectId(req.params.commentId);
        const postId = new mongoose.Types.ObjectId(req.postId);

        const likeMembers = await Comment.findOne({
            _id: commentId,
            post_id: postId
        }).select("like_members");

        if (likeMembers.like_members.length === 0) {
            return res.json({ success, message: "No Likes on this Comment" });
        } else {
            const memberIds = likeMembers.like_members.map(memberId => new mongoose.Types.ObjectId(memberId));
            const membersLiked = await User.find({ _id: { $in: memberIds } }).select("_id first_name last_name");

            if (membersLiked.length > 0) {
                success = true;
                return res.json({ success, membersLiked });
            } else {
                return res.status(500).send("Unable to fetch liked member list on the Comment");
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

//Update the Comment you have previously created
//localhost:3000/api/Community/getOne/653a2482efe81ef88c2b42a3/Post/653bc21bac5b8c1a425f09e8/Comment/653cc7ea470a8802640c6637/likeMembers
router.put('/updateComment/:commentId', checkComment, [
    body('description', 'Enter a Comment').isLength({ min: 1 }),
], async (req, res) => {
    const errors = validationResult(req);
    let success = false;

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        const commentId = new mongoose.Types.ObjectId(req.params.commentId);
        const postId = new mongoose.Types.ObjectId(req.postId);
        const commentorId = req.user.id
        const { description } = req.body;

        const commentor = await Comment.findOne(
            {
                _id: commentId,
                post_id: postId,
                commentor_id: commentorId
            }
        );
        if (commentor) {
            const comment = await Comment.findByIdAndUpdate(
                commentId,
                {
                    description: description
                },
                { new: true }
            );
            if (comment) {
                success = true;
                return res.json({ success, comment });
            }

            return res.status(500).send("Unable to update the Comment");

        }
        return res.status(500).send("You are not the Creator of the Comment");

    } catch (error) {
        console.error(error);
        return res.status(500).send("Some error occurred while processing the request");
    }
});

module.exports = router