const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const TeacherProfile = require('../Models/TeacherProfile');
const StudentProfile = require('../Models/StudentProfile');
const Codes = require('../Models/Codes');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose=require('mongoose');
const {body, validationResult} = require('express-validator');
const fetchuser = require('../Middlewares/fetchuser');

const JWT_SECRET = '@insha@is@a@good@girl@';

const generateUniqueRandomNumber = () => {
    const randomBytes = crypto.randomBytes(3);
    const randomNumber = parseInt(randomBytes.toString('hex'), 16) % 100000;
    const filePath = './used-random-numbers.txt';
  
    let usedNumbers = [];
    if (fs.existsSync(filePath)) {
      usedNumbers = fs.readFileSync(filePath, 'utf8').split(',');
    }
  
    while (usedNumbers.includes(randomNumber.toString())) {
      const randomBytes = crypto.randomBytes(3);
      const randomNumber = parseInt(randomBytes.toString('hex'), 16) % 100000;
    }
  
    usedNumbers.push(randomNumber.toString());
    fs.writeFileSync(filePath, usedNumbers.join(','));
  
    return randomNumber.toString().padStart(5, '0');
}

router.post('/CreateUser' , [
    body('first_name', 'Enter a valid First Name').isLength({min:3}),
    body('last_name', 'Enter a valid Last Name').isLength({min:3}),
    body('password', 'Enter a valid Password').isLength({min:5}),
    body('email', 'Enter a valid Email').isEmail(),
    body('gender', 'Select a valid gender').optional().isIn(['Male', 'Female']),
    body('country', 'Select a valid country').optional(),
    body('dob', 'Enter a valid date of birth').isISO8601(),
    body('privilege', 'Enter a valid privilege').optional().isIn(['Student', 'Teacher']),
] , async (req, res)=>{

    let success = false;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success, errors: errors.array()});
    }

    try{
        let user = await User.findOne({email: req.body.email});
        if(user){ 
            return res.status(400).json({success, error: "Sorry! A user with this email already exists"});
        }

        let privilegeCode;
        if (req.body.privilege === 'Student') {
            privilegeCode = await Codes.findOne({ code: 'Student' });
        } 
        else if (req.body.privilege === 'Teacher') {
            privilegeCode = await Codes.findOne({ code: 'Teacher' });
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash( req.body.password, salt);

        user = await User.create({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            password_hash: secPass,
            email: req.body.email,
            dob: req.body.dob,
            gender: req.body.gender,
            country: req.body.country,
            privilege_id: privilegeCode._id
        })

        if(req.body.privilege === 'Student'){
            await StudentProfile.create({
                student_profile_id: user.id
            });
        } 
        else if (req.body.privilege === 'Teacher') {
            await TeacherProfile.create({
                teacher_profile_id: user.id
            });
        }

        const data = {
            user:{
                id: user.id
            }
        }

        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken })
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Create User");
    }
});

router.post('/LoginUser', [
    body('password', 'Password cannot be blank').exists(),
    body('email', 'Enter a valid Email').isEmail(),
], async (req, res) => {
    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            success = false;
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        const passwordCompare = await bcrypt.compare(password, user.password_hash);
        if (!passwordCompare) {
            success = false;
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        const privilegeId = user.privilege_id;

        const code = await Codes.findById(privilegeId);

        if (!code) {
            success = false;
            return res.status(400).json({ success, error: "Invalid privilege type" });
        }

        const role = code.code;

        const data = {
            user:{
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;

        if (role === 'Student') {
            return res.json({ success, role: 'Student', authtoken });

        } 
        else if (role === 'Teacher') {
            return res.json({ success, role: 'Teacher', authtoken });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in Login User");
    }
});

router.post('/ForgotPassword', [
    body('email', 'Enter a valid Email').isEmail(),
], async (req, res) => {

    let success = false;
    const email = req.body.email;

    console.log(email)

    try{
        let user = await User.findOne({ email });
        if (!user) {
            success = false;
            return res.status(400).json({ success, message: "User not found" });
        }

        var code = generateUniqueRandomNumber();

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            user: 'advancetourguides@gmail.com',
            pass: 'crbvfzyiabzawftb'
            }
        });
        var mailOptions = {
            from: 'advancetourguides@gmail.com',
            to: `${email}`,
            subject: 'Forget Password - Code Validation',
            text: `Please use this code to get back to your account: ${code}`
        };
        
        transporter.sendMail(mailOptions, function(error, info){
            if(error) {
                console.log(error);
            } 
            else {
                success = true
                res.json({success, code, message: "Emailed Successfully"});
            }
        });
    }
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in Forgot Password");
    }
});

router.post('/ValidateCode/:code/:email', [
    body('email', 'Enter a valid Email').isEmail(),
], async (req, res) => {

    let success = false;
    const userCode = req.body.code;
    const actualCode = req.params.code;

    try{
        if (userCode != actualCode) {
            success = false;
            return res.status(400).json({ success, message: "Invalid Code" });
        }
        else{
            success = true;
            return res.json({success});
        }
    }
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in Code Validation");
    }
});

router.post('/ChangePassword/:email', [
    body('password', 'Enter a valid Password').isLength({min:5}),
    body('rePassword', 'Enter a valid Password').isLength({min:5}),
], async (req, res) => {

    let success = false;
    const password = req.body.password;
    const rePassword = req.body.rePassword;
    const email = req.params.email;

    try{
        if (password !== rePassword) {
            success = false;
            return res.status(400).json({ success, message: "Both the passwords don't match" });
        }
        else{
            const user = await User.findOne({ email: email });

            const salt = await bcrypt.genSalt(10);
            const secPass = await bcrypt.hash( password, salt);

            user.password_hash = secPass;
            user.save();
            
            success = true;
            return res.json({success});
        }
    }
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred in Code Validation");
    }
});

router.get('/GetUser/:key', fetchuser, async (req, res) => {
    let success = false;
    const user_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const id = req.params.key;

    try {
        const user = await User.findOne({ _id: new ObjectId(user_id) });

        if (!user) {
            return res.status(400).json({ success, error: "user not found" });
        }

        const user_data = await User.findOne({ _id: new ObjectId(id) });

        success = true;

        res.json({ success, user_data });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching course with learning post.");
    }
});

module.exports = router