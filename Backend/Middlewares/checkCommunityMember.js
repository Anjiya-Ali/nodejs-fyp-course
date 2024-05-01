const mongoose = require('mongoose');
const Community = require('../Models/Community');

const checkCommunityMember = async (req, res, next) => {
    const communityId = new mongoose.Types.ObjectId(req.params.communityId);
    const memberId = req.user.id;

    try {
        const communityMember = await Community.findOne({
            _id: communityId,
            members_id: { $in: [memberId] }
        });

        if (communityMember) {
            req.communityId = req.params.communityId;
            next();
        } else {
            let success = false;
            return res.json({ success, message: "Member doesn't exist in the community." });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the community's member" });
    }
};

module.exports = checkCommunityMember;
