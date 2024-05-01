const mongoose = require('mongoose');
const CommunityPosts = require('../Models/CommunityPosts');

const checkCommunityPost = async (req, res, next) => {
    const communityId = new mongoose.Types.ObjectId(req.communityId);
    const postId = new mongoose.Types.ObjectId(req.params.postId);

    try {
        const communityPost = await CommunityPosts.findOne(
            {
                community_id: communityId,
                post_id: postId
            }
        );
        if (communityPost) {
            req.postId = req.params.postId
            next();
        } else {
            let success = false;
            return res.json({ success, message: "Community Post doesn't exist." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the community post" });
    }
};

module.exports = checkCommunityPost;