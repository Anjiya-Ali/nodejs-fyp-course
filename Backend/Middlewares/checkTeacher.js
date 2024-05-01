const mongoose = require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');

const checkTeacher = async (req, res, next) => {
    const teacherId = new mongoose.Types.ObjectId(req.user.id);

    console.log(req.user.id)
    try {
        const teacher = await TeacherProfile.findOne({ teacher_profile_id: teacherId });
        if (teacher) {
            next();
        } else {
            let success = false;
            return res.json({ success, message: "Teacher does not exists" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the Teacher" });
    }
};

module.exports = checkTeacher;
