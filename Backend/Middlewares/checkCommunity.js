const mongoose = require('mongoose');
const Community = require('../Models/Community');

const checkCommunity = async (req, res, next) => {
    console.log(req.params.communityId)

    const communityId = new mongoose.Types.ObjectId(req.params.communityId);
    try {
        const community = await Community.findById(communityId);
        if (community) {
            next();
        } else {
            let success = false;
            return res.json({ success, message: "Community doesn't exist." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the community" });
    }
};

module.exports = checkCommunity;
