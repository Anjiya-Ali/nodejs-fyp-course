const express = require('express');
const router = express.Router();
const Skills = require('../Models/Skills');
const Interest = require('../Models/Interest');
const StudentProfile = require('../Models/StudentProfile');
const TeacherProfile = require('../Models/TeacherProfile');
const User = require('../Models/User');
const Revenue = require('../Models/Revenue');
const mongoose=require('mongoose');
const {param, body, validationResult} = require('express-validator');

const fetchuser = require('../Middlewares/fetchuser');

router.post('/AddSkill' , async (req, res)=>{
    try{

        const skill = await Skills.create({
            name: req.body.name,
        })

        const skills = await Skills.find({});
        const Success = true;
        res.json({ Success, skills })
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in adding skill");
    }
})

router.post('/AddInterest' , async (req, res)=>{
    try{

        const interest = await Interest.create({
            name: req.body.name,
        })

        const interests = await Interest.find({});
        const Success = true;
        res.json({ Success, interests })
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in adding interest");
    }
})

router.post('/AddRevenue' , async (req, res)=>{
    try{
        const revenuee = await Revenue.create({
            month: req.body.month,
            year: req.body.year,
            amount: req.body.amount
        })

        const revenue = await Revenue.find({});
        const Success = true;
        res.json({ Success, revenue })
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in adding revenue");
    }
})

router.get('/GetInterests', async (req, res) => {
    try {
        const interests = await Interest.find({}, 'name').sort({ name: 1 });
        const interestNames = interests.map(interest => interest.name);

        res.json({ success: true, interests: interestNames });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching interest names");
    }
});

router.get('/GetSkills', async (req, res) => {
    try {
        const skills = await Skills.find({}, 'name').sort({ name: 1 });
        const skillNames = skills.map(skill => skill.name);

        res.json({ success: true, skills: skillNames });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching skill names");
    }
});

const formatMonthYear = (month, year) => {
  const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[month - 1]} ${year}`;
};

router.get('/GetRevenuePerMonth', async (req, res) => {
    try {
        const last12MonthsAggregated = await Revenue.aggregate([
            {
              $group: {
                _id: { month: "$month", year: "$year" },
                totalAmount: { $sum: "$amount" }
              }
            },
            {
              $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
              $limit: 12
            },
            {
              $project: {
                _id: 0,
                month: "$_id.month",
                year: "$_id.year",
                totalAmount: 1
              }
            }
        ]);

        const formattedRevenues = last12MonthsAggregated.map((user) => ({
          ...user,
          formattedDate: formatMonthYear(user.month, user.year),
        }));

        res.json({ success: true, revenue: formattedRevenues });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching revenue");
    }
});

router.get('/GetUniqueUsersPerMonth', async (req, res) => {
    try {
        
        const last12MonthsUserCount = await User.aggregate([
            {
              $addFields: {
                parsedDate: {
                  $dateFromString: {
                    dateString: "$RegisteringDate",
                    format: "%Y-%m-%dT%H:%M:%S.%L%z"
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  month: { $month: "$parsedDate" },
                  year: { $year: "$parsedDate" }
                },
                userCount: { $sum: 1 }
              }
            },
            {
              $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
              $limit: 12
            },
            {
              $project: {
                _id: 0,
                month: "$_id.month",
                year: "$_id.year",
                userCount: 1
              }
            }
          ]);

          const formattedUsers = last12MonthsUserCount.map((user) => ({
            ...user,
            formattedDate: formatMonthYear(user.month, user.year),
          }));

        res.json({ success: true, users: formattedUsers });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching revenue");
    }
});

router.get('/ManageStudents', async (req, res) => {
  try {
      const students = await StudentProfile.find({});
      let studentInfo = []

      for (const std of students){

        const user = await User.findOne({_id : std.student_profile_id, status : "Active"});

        if(user){
          studentInfo.push({
            name: user.first_name + " " + user.last_name,
            id: user._id,
            profile_picture: std.profile_picture,
            bio: std.bio_information
          });
        }

      }

      res.json({ success: true, students: studentInfo });
  } 
  
  catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while fetching students");
  }
});

router.delete('/DeleteStudent/:student_id', async (req, res) => {
  try {
      const ObjectId = mongoose.Types.ObjectId;
      const student_id = req.params.student_id;

      const student = await User.findOne({_id : new ObjectId(student_id)});
      student.status = "Deleted";
      student.save();

      res.json({ success: true, student });
  } 
  
  catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while deleting student");
  }
});

router.get('/ManageTeachers', async (req, res) => {
  try {
      const teachers = await TeacherProfile.find({});
      let teacherInfo = []

      for (const tch of teachers){

        const user = await User.findOne({_id : tch.teacher_profile_id, status : "Active"});

        if(user){
          teacherInfo.push({
            name: user.first_name + " " + user.last_name,
            id: user._id,
            profile_picture: tch.profile_picture,
            bio: tch.bio_information
          });
        }

      }

      res.json({ success: true, teachers: teacherInfo });
  } 
  
  catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while fetching teachers");
  }
});

router.delete('/DeleteTeacher/:teacher_id', async (req, res) => {
  try {
      const ObjectId = mongoose.Types.ObjectId;
      const teacher_id = req.params.teacher_id;

      const teacher = await User.findOne({_id : new ObjectId(teacher_id)});
      teacher.status = "Deleted";
      teacher.save();

      res.json({ success: true, teacher });
  } 
  
  catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while deleting teacher");
  }
});

module.exports = router