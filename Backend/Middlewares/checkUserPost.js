const mongoose = require('mongoose');
const UserPost = require('../Models/UserPosts');

const checkUserPost = async (req, res, next) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const postId = new mongoose.Types.ObjectId(req.params.postId);

    try {
        const userPost = await UserPost.findOne(
            {
                user_id: userId,
                post_id: postId
            }
        );
        if (userPost) {
            next();
        } else {
            let success = false;
            return res.json({ success, message: "User Post doesn't exist." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the User post" });
    }
};

module.exports = checkUserPost;