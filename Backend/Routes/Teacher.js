const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const TeacherProfile = require('../Models/TeacherProfile');
const StudentProfile = require('../Models/StudentProfile');
const Codes = require('../Models/Codes');
const SocialHub = require('../Models/SocialHub');
const mongoose=require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const {param, body, validationResult} = require('express-validator');

const fetchuser = require('../Middlewares/fetchuser');

const JWT_SECRET = '@insha@is@a@good@girl@';

//GET UNIQUE RANDOM NUMBERS
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

//PROFILE PICTURE

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'Uploads/ProfilePictures';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post('/UploadProfilePicture', fetchuser, upload.single('profilePicture'), async(req, res) => { //For Both Adding and Updaing Profile Picture
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const teacher_profile_id = req.user.id
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const profilePictureUrl = `Uploads/ProfilePictures/${req.file.originalname}`;

        teacherProfile.profile_picture = profilePictureUrl;
        await teacherProfile.save();

        res.json({ success: true, profilePictureUrl });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while uploading profile picture");
    }
});

router.delete('/DeleteProfilePicture', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const profilePictureUrl = teacherProfile.profile_picture;

        if (profilePictureUrl) {
            fs.unlink(profilePictureUrl, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success, error: "Error deleting the profile picture" });
                }
            });

            teacherProfile.profile_picture = null;
            await teacherProfile.save();

            success = true;
            res.json({ success, message: "Profile picture deleted successfully" });
        } 
        else {
            return res.status(404).json({ success, error: "Profile picture not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting profile picture");
    }
});

router.get('/ProfilePicture', fetchuser, async(req, res) => {             
    const teacher_profile_id = req.user.id
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });
        if (!teacherProfile) {
            return res.status(400).json({ success: false, error: "Teacher profile not found" });
        }

        const filePath = teacherProfile.profile_picture

        if (fs.existsSync(filePath)) {
            const absolutePath = path.join('C:/Users/insha/FYP-Temp/Backend', filePath);
            res.sendFile(absolutePath);
        } 
        else {
            res.status(404).json({ success: false, error: 'Profile picture not found' });
        }
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching profile picture");
    }                    
});

//FEEDBACK

router.post('/AddFeedback/:teacher_profile_id', fetchuser, [                                                    //Both Adding and Updating Feedback
    body('feedback', 'Enter a valid feedback').isString().isIn(['1', '2', '3', '4', '5']),
    body('feedback_text', 'Enter a valid feedback text').isString().isLength({ min: 5 }),
], async (req, res) => {

    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const userId = req.user.id;
    const teacher_profile_id = req.params.teacher_profile_id
    const { feedback, feedback_text } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const userProfile = await User.findOne({ _id : new ObjectId(userId) });
        if (!userProfile) {
            return res.status(400).json({ success, error: "User profile not found" });
        }

        const feedbackProviderId = userId;
        const feedbackProviderFullName = userProfile.first_name + " " +userProfile.last_name

        const privilegeId = userProfile.privilege_id;
        const privilegeCode = await Codes.findOne({ _id : new ObjectId(privilegeId)});
        const privilege = privilegeCode.code;

        let feedbackProviderProfilePicture;
        if(privilege === "Student"){
            const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(userId) });
            feedbackProviderProfilePicture = studentProfile.profile_picture
        }
        else if(privilege === "Teacher"){
            const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(userId) });
            feedbackProviderProfilePicture = teacherProfile.profile_picture
        }

        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentFeedback = teacherProfile.feedback ? JSON.parse(teacherProfile.feedback) : [];

        var key = generateUniqueRandomNumber();

        const feedbackObj = {
            id: key,
            feedback: feedback,
            feedback_text: feedback_text,
            feedbackProviderFullName: feedbackProviderFullName,
            feedbackProviderProfilePicture: feedbackProviderProfilePicture,
            feedbackProviderId: feedbackProviderId
        };

        currentFeedback.unshift(feedbackObj);

        teacherProfile.feedback = JSON.stringify(currentFeedback);

        await teacherProfile.save();

        const feedbacks = teacherProfile.feedback ? JSON.parse(teacherProfile.feedback) : [];

        success = true;
        res.json({ success, feedbacks, message: "Feedback added successfully" });
    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding feedback");
    }
});

//BIO

router.post('/AddBio', fetchuser, [                                     //Both Adding and Updating Bio
    body('bio', 'Enter a valid bio').isString().isLength({ min: 5 }),
], async (req, res) => {
    let success = false;

    const { bio } = req.body;
    const teacher_profile_id = req.user.id;

    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        teacherProfile.bio_information = bio;

        await teacherProfile.save();

        success = true;
        res.json({ success, bio });

    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding the bio");
    }
});

router.get('/GetBio', fetchuser, [], async (req, res) => {                                                            //As Bio Can be Updated
    let success = false;

    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const bio = teacherProfile.bio_information;

        success = true;
        res.json({ success, bio });
    } 

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching the bio");
    }
});

//CONNECTIONS
//In social hub

//EDUCATION

router.post('/AddEducation', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Education
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const school = req.body.school;
        const degree = req.body.degree;
        const start_date = req.body.start_date;
        const end_date = req.body.end_date;
        const grade = req.body.grade;

        if(!end_date){
            end_date = "Present"
        }
        else{
            if(start_date > end_date){
                success = false;
                return res.json({ success, message : "Start date cannot be greater than end date" });
            }
        }

        const currentEducations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        var key = generateUniqueRandomNumber();

        const educationObj = {
            id: key,
            school: school,
            degree: degree,
            start_date: start_date,
            end_date: end_date,
            grade: grade,
        };

        let insertIndex = 0;

        while (insertIndex < currentEducations.length && currentEducations[insertIndex].start_date > start_date) {
            insertIndex++;
        }

        currentEducations.splice(insertIndex, 0, educationObj);

        teacherProfile.education = JSON.stringify(currentEducations);

        await teacherProfile.save();

        const educations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        success = true;
        res.json({ success, educations });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding education");
    }
});

router.delete('/DeleteEducation/:educationKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const educationKey = req.params.educationKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentEducations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        const educationIndex = currentEducations.findIndex((education) => education.id === educationKey);

        if (educationIndex !== -1) {
            currentEducations.splice(educationIndex, 1);

            teacherProfile.education = JSON.stringify(currentEducations);

            await teacherProfile.save();

            const educations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

            success = true;
            res.json({ success, educations });
        } 
        else {
            return res.status(404).json({ success, error: "Education not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting education");
    }
});

router.get('/GetEducations', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const educations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        success = true;
        res.json({ success, educations });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching educations");
    }
});

router.get('/GetEducation/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const educations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        const education = educations.find(education => education.id === key);

        if (!education) {
            return res.status(404).json({ success, error: "Education not found" });
        }

        success = true;
        res.json({ success, education });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching single education");
    }
});

router.put('/EditEducation/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    
    const school = req.body.school;
    const degree = req.body.degree;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const grade = req.body.grade;

    if(!end_date){
        end_date = "Present"
    }
    else{
        if(start_date > end_date){
            success = false;
            return res.json({ success, message : "Start date cannot be greater than end date" });
        }
    }

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let educations = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        const educationIndex = educations.findIndex(education => education.id === key);

        if (educationIndex === -1) {
            return res.status(404).json({ success, error: "Education not found" });
        }

        const editedEducation = educations.splice(educationIndex, 1)[0];

        editedEducation.school = school;
        editedEducation.degree = degree;
        editedEducation.start_date = start_date;
        editedEducation.end_date = end_date;
        editedEducation.grade = grade;

        let insertIndex = 0;

        while (insertIndex < educations.length && educations[insertIndex].start_date > start_date) {
            insertIndex++;
        }

        educations.splice(insertIndex, 0, editedEducation);

        teacherProfile.education = JSON.stringify(educations);
        await teacherProfile.save();

        success = true;
        res.json({ success, educations });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the education");
    }
});

//EXPERIENCES

router.post('/AddExperience', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Education
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const title = req.body.title;
        const company = req.body.company;
        const start_date = req.body.start_date;
        let end_date = req.body.end_date;
        const location = req.body.location;

        if(start_date > end_date){
            success = false;
            return res.json({ success, message : "Start date cannot be greater than end date" });
        }

        const currentExperiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        var key = generateUniqueRandomNumber();

        const experienceObj = {
            id: key,
            title: title,
            company: company,
            start_date: start_date,
            end_date: end_date,
            location: location,
        };

        let insertIndex = 0;

        while (insertIndex < currentExperiences.length && currentExperiences[insertIndex].start_date > start_date) {
            insertIndex++;
        }

        currentExperiences.splice(insertIndex, 0, experienceObj);

        teacherProfile.experience = JSON.stringify(currentExperiences);

        await teacherProfile.save();

        const experiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        success = true;
        res.json({ success, experiences });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding experience");
    }
});

router.delete('/DeleteExperience/:experienceKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const experienceKey = req.params.experienceKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentExperiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        const experienceIndex = currentExperiences.findIndex((experience) => experience.id === experienceKey);

        if (experienceIndex !== -1) {
            currentExperiences.splice(experienceIndex, 1);

            teacherProfile.experience = JSON.stringify(currentExperiences);

            await teacherProfile.save();

            const experiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

            success = true;
            res.json({ success, experiences });
        } 
        else {
            return res.status(404).json({ success, error: "Experience not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting experience");
    }
});

router.get('/GetExperiences', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const experiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        success = true;
        res.json({ success, experiences });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching experiences");
    }
});

router.get('/GetExperience/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const experiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        const experience = experiences.find(experience => experience.id === key);

        if (!experience) {
            return res.status(404).json({ success, error: "Experience not found" });
        }

        success = true;
        res.json({ success, experience });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching single experience");
    }
});

router.put('/EditExperience/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    
    const title = req.body.title;
    const company = req.body.company;
    const start_date = req.body.start_date;
    let end_date = req.body.end_date;
    const location = req.body.location;

    if(!end_date){
        end_date = "Present"
    }
    else{
        if(start_date > end_date){
            success = false;
            return res.json({ success, message : "Start date cannot be greater than end date" });
        }
    }

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let experiences = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        const experienceIndex = experiences.findIndex(experience => experience.id === key);

        if (experienceIndex === -1) {
            return res.status(404).json({ success, error: "Experience not found" });
        }

        const editedExperience = experiences.splice(experienceIndex, 1)[0];

        editedExperience.company = company;
        editedExperience.title = title;
        editedExperience.start_date = start_date;
        editedExperience.end_date = end_date;
        editedExperience.location = location;

        let insertIndex = 0;

        while (insertIndex < experiences.length && experiences[insertIndex].start_date > start_date) {
            insertIndex++;
        }

        experiences.splice(insertIndex, 0, editedExperience);

        teacherProfile.experience = JSON.stringify(experiences);
        await teacherProfile.save();

        success = true;
        res.json({ success, experiences });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the experience");
    }
});

//CERTIFICATIONS

router.post('/AddCertifications', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const title = req.body.title;
        const issuer = req.body.issuer;
        const link = req.body.link;

        const currentCertifications = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        var key = generateUniqueRandomNumber();

        const certificateObj = {
            id: key,
            title: title,
            issuer: issuer,
            link: link
        };

        currentCertifications.unshift(certificateObj);

        teacherProfile.certificates = JSON.stringify(currentCertifications);

        await teacherProfile.save();

        const certifications = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        success = true;
        res.json({ success, certifications });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding certificates");
    }
});

router.delete('/DeleteCertificate/:certificateKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const certificateKey = req.params.certificateKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentCertificates = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        const certificateIndex = currentCertificates.findIndex((project) => project.id === certificateKey);

        if (certificateIndex !== -1) {
            currentCertificates.splice(certificateIndex, 1);

            teacherProfile.certificates = JSON.stringify(currentCertificates);

            await teacherProfile.save();

            const certificates = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

            success = true;
            res.json({ success, certificates });
        } 
        else {
            return res.status(404).json({ success, error: "Certificate not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting certificate");
    }
});

router.get('/GetCertifications', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const certifications = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        success = true;
        res.json({ success, certifications });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching certificates");
    }
});

router.get('/GetCertificate/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const certifications = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        const certification = certifications.find(certification => certification.id === key);

        if (!certification) {
            return res.status(404).json({ success, error: "Certification not found" });
        }

        success = true;
        res.json({ success, certification });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching the certificate");
    }
});

router.put('/EditCertification/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { title, issuer, link } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let certifications = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        const certificateIndex = certifications.findIndex(certification => certification.id === key);

        if (certificateIndex === -1) {
            return res.status(404).json({ success, error: "Certificate not found" });
        }

        certifications[certificateIndex].title = title;
        certifications[certificateIndex].issuer = issuer;
        certifications[certificateIndex].link = link;

        teacherProfile.certificates = JSON.stringify(certifications);
        await teacherProfile.save();

        success = true;
        res.json({ success, certifications });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the certificate");
    }
});

//PROJECTS

router.post('/AddProjects', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    const title = req.body.title;
    const description = req.body.description;
    const start_date = req.body.start_date;
    let end_date = req.body.end_date;
    const link = req.body.link;

    if(!end_date){
        end_date = "Present"
    }
    else{
        if(start_date > end_date){
            success = false;
            return res.json({ success, message : "Start date cannot be greater than end date" });
        }
    }

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentProjects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        var key = generateUniqueRandomNumber();

        const projectObj = {
            id: key,
            title: title,
            description: description,
            link: link,
            start_date: start_date,
            end_date: end_date
        };

        let insertIndex = 0;

        while (insertIndex < currentProjects.length && currentProjects[insertIndex].start_date > start_date) {
            insertIndex++;
        }

        currentProjects.splice(insertIndex, 0, projectObj);

        teacherProfile.projects = JSON.stringify(currentProjects);

        await teacherProfile.save();

        const projects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        success = true;
        res.json({ success, projects });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding projects");
    }
});

router.delete('/DeleteProject/:projectKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const projectKey = req.params.projectKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentProjects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        const projectIndex = currentProjects.findIndex((project) => project.id === projectKey);

        if (projectIndex !== -1) {
            currentProjects.splice(projectIndex, 1);

            teacherProfile.projects = JSON.stringify(currentProjects);

            await teacherProfile.save();

            const projects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

            success = true;
            res.json({ success, projects });
        } 
        else {
            return res.status(404).json({ success, error: "Project not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting Project");
    }
});

router.get('/GetProjects', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const projects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        success = true;
        res.json({ success, projects });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching projects");
    }
});

router.get('/GetProject/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const projects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        const project = projects.find(project => project.id === key);

        if (!project) {
            return res.status(404).json({ success, error: "Project not found" });
        }

        success = true;
        res.json({ success, project });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching the project");
    }
});

router.put('/EditProject/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    
    const title = req.body.title;
    const description = req.body.description;
    const start_date = req.body.start_date;
    let end_date = req.body.end_date;
    const link = req.body.link;

    if(!end_date){
        end_date = "Present"
    }
    else{
        if(start_date > end_date){
            success = false;
            return res.json({ success, message : "Start date cannot be greater than end date" });
        }
    }

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let projects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        const projectIndex = projects.findIndex(project => project.id === key);

        if (projectIndex === -1) {
            return res.status(404).json({ success, error: "Project not found" });
        }

        const editedProject = projects.splice(projectIndex, 1)[0];

        editedProject.title = title;
        editedProject.description = description;
        editedProject.start_date = start_date;
        editedProject.end_date = end_date;
        editedProject.link = link;

        let insertIndex = 0;

        while (insertIndex < projects.length && projects[insertIndex].start_date > start_date) {
            insertIndex++;
        }

        projects.splice(insertIndex, 0, editedProject);

        teacherProfile.projects = JSON.stringify(projects);
        await teacherProfile.save();

        success = true;
        res.json({ success, projects });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the projects");
    }
});

//HONORS AND AWARDS

router.post('/AddHAW', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    const title = req.body.title;
    const issuer = req.body.issuer;
    const issue_date = req.body.issue_date;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentHAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        var key = generateUniqueRandomNumber();

        const HAWObj = {
            id: key,
            title: title,
            issuer: issuer,
            issue_date: issue_date
        };

        let insertIndex = 0;

        while (insertIndex < currentHAW.length && currentHAW[insertIndex].issue_date > issue_date) {
            insertIndex++;
        }

        currentHAW.splice(insertIndex, 0, HAWObj);

        teacherProfile.honors_and_awards = JSON.stringify(currentHAW);

        await teacherProfile.save();

        const HAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        success = true;
        res.json({ success, HAW });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding HAW");
    }
});

router.delete('/DeleteHAW/:hawKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const hawKey = req.params.hawKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentHAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        const hawIndex = currentHAW.findIndex((haw) => haw.id === hawKey);

        if (hawIndex !== -1) {
            currentHAW.splice(hawIndex, 1);

            teacherProfile.honors_and_awards = JSON.stringify(currentHAW);

            await teacherProfile.save();

            const HAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

            success = true;
            res.json({ success, HAW });
        } 
        else {
            return res.status(404).json({ success, error: "HAW not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting HAW");
    }
});

router.get('/GetHAW', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const HAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        success = true;
        res.json({ success, HAW });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching HAW");
    }
});

router.get('/GetHAW/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const HAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        const haw = HAW.find(haw => haw.id === key);

        if (!haw) {
            return res.status(404).json({ success, error: "HAW not found" });
        }

        success = true;
        res.json({ success, haw });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching the haw");
    }
});

router.put('/EditHAW/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    
    const title = req.body.title;
    const issuer = req.body.issuer;
    const issue_date = req.body.issue_date;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let HAW = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        const HAWIndex = HAW.findIndex(haw => haw.id === key);

        if (HAWIndex === -1) {
            return res.status(404).json({ success, error: "HAW not found" });
        }

        const editedHAW = HAW.splice(HAWIndex, 1)[0];

        editedHAW.title = title;
        editedHAW.issuer = issuer;
        editedHAW.issue_date = issue_date;

        let insertIndex = 0;

        while (insertIndex < HAW.length && HAW[insertIndex].issue_date > issue_date) {
            insertIndex++;
        }

        HAW.splice(insertIndex, 0, editedHAW);

        teacherProfile.honors_and_awards = JSON.stringify(HAW);
        await teacherProfile.save();

        success = true;
        res.json({ success, HAW });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the HAW");
    }
});

//SKILLS

router.post('/AddSkills', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const name = req.body.name;

        const currentSkills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

        const skillExists = currentSkills.some(skill => skill.name === name);

        if (skillExists) {
            return res.json({ success, error: "Skill with this name already exists" });
        }

        var key = generateUniqueRandomNumber();

        const skillsObj = {
            id: key,
            name: name
        };

        currentSkills.unshift(skillsObj);

        teacherProfile.skills = JSON.stringify(currentSkills);

        await teacherProfile.save();

        const skills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

        success = true;
        res.json({ success, skills });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding skills");
    }
});

router.delete('/DeleteSkills/:skillKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const skillKey = req.params.skillKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentSkills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

        const skillIndex = currentSkills.findIndex((skill) => skill.id === skillKey);

        if (skillIndex !== -1) {
            currentSkills.splice(skillIndex, 1);

            teacherProfile.skills = JSON.stringify(currentSkills);

            await teacherProfile.save();

            const skills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

            success = true;
            res.json({ success, skills });
        } 
        else {
            return res.status(404).json({ success, error: "Skill not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting skill");
    }
});

router.get('/GetSkills', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const skills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

        success = true;
        res.json({ success, skills });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching skills");
    }
});

router.get('/GetSkill/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const skills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

        const skill = skills.find(skill => skill.id === key);

        if (!skill) {
            return res.status(404).json({ success, error: "Skill not found" });
        }

        success = true;
        res.json({ success, skill });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching the skill");
    }
});

router.put('/EditLanguage/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { name, level } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        const languageIndex = languages.findIndex(language => language.id === key);

        if (languageIndex === -1) {
            return res.status(404).json({ success, error: "Language not found" });
        }

        languages[languageIndex].name = name;
        languages[languageIndex].level = level;

        teacherProfile.language = JSON.stringify(languages);
        await teacherProfile.save();

        success = true;
        res.json({ success, languages });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the Language");
    }
});

//LANGUAGES

router.post('/AddLanguages', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const name = req.body.name;
        const level = req.body.level;

        const currentLanguages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        var key = generateUniqueRandomNumber();

        const languageObj = {
            id: key,
            name: name,
            level: level,
        };

        currentLanguages.unshift(languageObj);

        teacherProfile.language = JSON.stringify(currentLanguages);

        await teacherProfile.save();

        const languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        success = true;
        res.json({ success, languages });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding languages");
    }
});

router.delete('/DeleteLanguage/:languageKey', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const languageKey = req.params.languageKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const currentLanguages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        const languageIndex = currentLanguages.findIndex((language) => language.id === languageKey);

        if (languageIndex !== -1) {
            currentLanguages.splice(languageIndex, 1);

            teacherProfile.language = JSON.stringify(currentLanguages);

            await teacherProfile.save();

            const languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

            success = true;
            res.json({ success, languages });
        } 
        else {
            return res.status(404).json({ success, error: "Language not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting language");
    }
});

router.get('/GetLanguages', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        success = true;
        res.json({ success, languages });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching languages");
    }
});

router.get('/GetLanguage/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        const language = languages.find(language => language.id === key);

        if (!language) {
            return res.status(404).json({ success, error: "Language not found" });
        }

        success = true;
        res.json({ success, language });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching the language");
    }
});

router.put('/EditLanguage/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { name, level } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        let languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        const languageIndex = languages.findIndex(language => language.id === key);

        if (languageIndex === -1) {
            return res.status(404).json({ success, error: "Language not found" });
        }

        languages[languageIndex].name = name;
        languages[languageIndex].level = level;

        teacherProfile.language = JSON.stringify(languages);
        await teacherProfile.save();

        success = true;
        res.json({ success, languages });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the Language");
    }
});

//add experience, remove badges, add projects, skills, honors and awards
router.get('/GetProfile', fetchuser, async (req, res) => {
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        //feedback
        let feedbackArray = [];
        const feedbackss = teacherProfile.feedback ? JSON.parse(teacherProfile.feedback) : [];
        feedbackss.forEach((feedback) => {
            const parsedFeedback = parseInt(feedback.feedback, 10);
            if (!isNaN(parsedFeedback)) {
                feedbackArray.push(parsedFeedback);
            }
        });
        let feedback = 0;
        if (feedbackArray.length > 0) {
            feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;
        }

        //feedbacks
        const feedbacks = teacherProfile.feedback ? JSON.parse(teacherProfile.feedback) : [];

        //total connections
        const total_connections = teacherProfile.total_connections;

        //total followers
        const total_followers = teacherProfile.total_followers;

        //location
        const userProfile = await User.findOne({ _id : new ObjectId(teacher_profile_id) });
        const location = userProfile.country;

        //bio
        const bio = teacherProfile.bio_information;

        //full_name
        const full_name = userProfile.first_name + " " + userProfile.last_name;

        //profile_picture
        var profile_picture = teacherProfile.profile_picture;

        //education
        const education = teacherProfile.education ? JSON.parse(teacherProfile.education) : [];

        //experience
        const experience = teacherProfile.experience ? JSON.parse(teacherProfile.experience) : [];

        //certifications
        const certifications = teacherProfile.certificates ? JSON.parse(teacherProfile.certificates) : [];

        //projects
        const projects = teacherProfile.projects ? JSON.parse(teacherProfile.projects) : [];

        //haw
        const haw = teacherProfile.honors_and_awards ? JSON.parse(teacherProfile.honors_and_awards) : [];

        //skills
        const skills = teacherProfile.skills ? JSON.parse(teacherProfile.skills) : [];

        //languages
        const languages = teacherProfile.language ? JSON.parse(teacherProfile.language) : [];

        success = true;
        res.json({ success, feedback, feedbacks, total_connections, total_followers, location, bio, full_name,  profile_picture, education, experience, certifications, projects, haw, skills, languages});
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while returning the profile");
    }
});

//GET PROFILE PICTURE

router.get('/GetProfilePicture', fetchuser, async (req, res) => {
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({
            teacher_profile_id: new ObjectId(teacher_profile_id),
        });

        if (!teacherProfile) {
            return res.status(404).json({ success: false, error: 'Teacher profile not found' });
        }

        const profilePictureUrl = teacherProfile.profile_picture;

        if (!profilePictureUrl) {
            return res.status(404).json({ success: false, error: 'Profile picture not found' });
        }

        // Send the profile picture URL in the response
        res.json({ success: true, profilePictureUrl });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Some error occurred while fetching profile picture');
    }
});

module.exports = router