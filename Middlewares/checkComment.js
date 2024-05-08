const mongoose = require('mongoose');
const Comment = require('../Models/Comments');

const checkComment = async (req, res, next) => {
    const commentId = new mongoose.Types.ObjectId(req.params.commentId);
    const postId = new mongoose.Types.ObjectId(req.postId);
    try {
        const comment = await Comment.findOne(
            {
                _id: commentId,
                post_id: postId
            }
        );
        if (comment) {
            next();
        } else {
            let success = false;
            return res.json({ success, message: "Comment doesn't exists." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the comment" });
    }
};

module.exports = checkComment;
