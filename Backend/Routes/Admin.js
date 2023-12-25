const express = require('express');
const router = express.Router();
const Skills = require('../Models/Skills');
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

// router.get('/CreateCourse' , async (req, res)=>{
//     try{
//         const course1 = await CoursesTemp.create({
//             name: "Data Science"
//         })
    
//         const course2 = await CoursesTemp.create({
//             name: "Web Application Development"
//         })

//         const course3 = await CoursesTemp.create({
//             name: "Cloud Computing"
//         })

//         const course4 = await CoursesTemp.create({
//             name: "Business Analysis"
//         })

//         const course5 = await CoursesTemp.create({
//             name: "Mobile Application Development"
//         })

//         const course6 = await CoursesTemp.create({
//             name: "Product Management"
//         })

//         const Success = true;
//         res.json({ Success })
//     }

//     catch(error){
//         console.error(error.message);
//         res.status(500).send("Some error occured in create course");
//     }
// })

module.exports = router