const mongoose = require('mongoose');
const StudentProfile = require('../Models/StudentProfile');

const checkStudent = async (req, res, next) => {
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    console.log(req.user.id)
    try {
        const student = await StudentProfile.findOne({ student_profile_id: studentId });
        if (student) {
            next();
        } else {
            let success = false;
            return res.json({ success, message: "Student does not exists" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Error fetching the Student" });
    }
};

module.exports = checkStudent;
