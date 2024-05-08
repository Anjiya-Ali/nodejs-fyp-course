const mongoose = require('mongoose');
const CommunityPosts = require('../Models/CommunityPosts');

const checkNotCommunityPost = async (req, res, next) => {
    const postId = new mongoose.Types.ObjectId(req.params.postId);

    try {
        const communityPost = await CommunityPosts.findOne(
            {
                post_id: postId
            }
        );
        if (!communityPost) {
            req.postId = req.params.postId
            next();
        } else {
            let success = false;
            return res.json({ success, message: "This is a Community Post you can't edit directly here." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the community post" });
    }
};

module.exports = checkNotCommunityPost;