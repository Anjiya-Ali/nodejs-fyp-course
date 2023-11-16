const express = require('express');
const router = express.Router();
const User = require('../Models/User');
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

    const student_profile_id = req.user.id
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const profilePictureUrl = `Uploads/ProfilePictures/${req.file.originalname}`;

        studentProfile.profile_picture = profilePictureUrl;
        await studentProfile.save();

        res.json({ success: true, profilePictureUrl });
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding feedback");
    }
});

router.get('/ProfilePicture', fetchuser, async(req, res) => {             
    const student_profile_id = req.user.id
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });
        if (!studentProfile) {
            return res.status(400).json({ success: false, error: "Student profile not found" });
        }

        const filePath = studentProfile.profile_picture

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

router.post('/AddFeedback', fetchuser, [                                                    //Both Adding and Updating Feedback
    body('feedback', 'Enter a valid feedback').isString().isIn(['1', '2', '3', '4', '5'])
], async (req, res) => {

    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const student_profile_id = req.user.id
    const { feedback } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const currentFeedback = studentProfile.feedback || '';
        const newFeedback = currentFeedback + (currentFeedback ? ' ' : '') + feedback;

        studentProfile.feedback = newFeedback;
        await studentProfile.save();

        success = true;
        res.json({ success, message: "Feedback added successfully" });
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
    const student_profile_id = req.user.id;

    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        studentProfile.bio_information = bio;

        await studentProfile.save();

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

    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const bio = studentProfile.bio_information;

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

//INTERESTS

router.post('/AddInterests', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id)});

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const title = req.body.title;
        const description = req.body.description;

        const currentInterests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        var key = generateUniqueRandomNumber();

        const interestObj = {
            id: key,
            title: title,
            description: description,
        };

        currentInterests.push(interestObj);

        studentProfile.interests = JSON.stringify(currentInterests);

        await studentProfile.save();

        const interests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        success = true;
        res.json({ success, interests });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding interests");
    }
});

router.get('/GetInterests', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const interests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        success = true;
        res.json({ success, interests });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching interests");
    }
});

router.get('/GetInterest/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const interests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        const interest = interests.find(interest => interest.id === key);

        if (!interest) {
            return res.status(404).json({ success, error: "Interest not found" });
        }

        success = true;
        res.json({ success, interest });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching single interest");
    }
});

router.put('/EditInterest/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { title, description } = req.body; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        let interests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        const interestIndex = interests.findIndex(interest => interest.id === key);

        if (interestIndex === -1) {
            return res.status(404).json({ success, error: "Interest not found" });
        }

        interests[interestIndex].title = title;
        interests[interestIndex].description = description;

        studentProfile.interests = JSON.stringify(interests);
        await studentProfile.save();

        success = true;
        res.json({ success, interests });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the interest");
    }
});

//EDUCATION

router.post('/AddEducation', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Education
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id)});

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const school = req.body.school;
        const degree = req.body.degree;
        const start_date = req.body.start_date;
        const end_date = req.body.end_date;
        const grade = req.body.grade;

        if(start_date > end_date){
            success = false;
            return res.json({ success, message : "Start date cannot be greater than end date" });
        }

        const currentEducations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

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

        studentProfile.education = JSON.stringify(currentEducations);

        await studentProfile.save();

        const educations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

        success = true;
        res.json({ success, educations });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding education");
    }
});

router.get('/GetEducations', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const educations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

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
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const educations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

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
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    
    const school = req.body.school;
    const degree = req.body.degree;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const grade = req.body.grade;

    if (start_date > end_date) {
        return res.status(400).json({ success, error: "Start date cannot be greater than end date" });
    }

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        let educations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

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

        studentProfile.education = JSON.stringify(educations);
        await studentProfile.save();

        success = true;
        res.json({ success, educations });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the education");
    }
});

//CERTIFICATIONS

router.post('/AddCertifications', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id)});

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const title = req.body.title;
        const instructor = req.body.instructor;

        const currentCertifications = studentProfile.certificates ? JSON.parse(studentProfile.certificates) : [];

        var key = generateUniqueRandomNumber();

        const certificateObj = {
            id: key,
            title: title,
            instructor: instructor,
        };

        currentCertifications.push(certificateObj);

        studentProfile.certificates = JSON.stringify(currentCertifications);

        await studentProfile.save();

        const certifications = studentProfile.certificates ? JSON.parse(studentProfile.certificates) : [];

        success = true;
        res.json({ success, certifications });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding certificates");
    }
});

router.get('/GetCertifications', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const certifications = studentProfile.certificates ? JSON.parse(studentProfile.certificates) : [];

        success = true;
        res.json({ success, certifications });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching interests");
    }
});

//BADGES

router.post('/AddBadges', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id)});

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const name = req.body.name;
        const level = req.body.level;

        const currentBadges = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];

        var key = generateUniqueRandomNumber();

        const badgeObj = {
            id: key,
            name: name,
            level: level,
        };

        currentBadges.unshift(badgeObj);

        studentProfile.badges = JSON.stringify(currentBadges);

        await studentProfile.save();

        const badges = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];

        success = true;
        res.json({ success, badges });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding badges");
    }
});

router.get('/GetBadges', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const badges = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];

        success = true;
        res.json({ success, badges });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while fetching badges");
    }
});

//LANGUAGES

router.post('/AddLanguages', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id)});

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const name = req.body.name;
        const level = req.body.level;

        const currentLanguages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

        var key = generateUniqueRandomNumber();

        const languageObj = {
            id: key,
            name: name,
            level: level,
        };

        currentLanguages.push(languageObj);

        studentProfile.language = JSON.stringify(currentLanguages);

        await studentProfile.save();

        const languages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

        success = true;
        res.json({ success, languages });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding languages");
    }
});

router.get('/GetLanguages', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const languages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

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
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const languages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

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
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { name, level } = req.body; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        let languages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

        const languageIndex = languages.findIndex(language => language.id === key);

        if (languageIndex === -1) {
            return res.status(404).json({ success, error: "Language not found" });
        }

        languages[languageIndex].name = name;
        languages[languageIndex].level = level;

        studentProfile.language = JSON.stringify(languages);
        await studentProfile.save();

        success = true;
        res.json({ success, languages });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the Language");
    }
});

router.get('/GetProfile', fetchuser, async (req, res) => {
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        //feedback
        const feedbackArray = studentProfile.feedback.split(' ').map(Number);
        const feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;

        //total connections
        const myConnections = await SocialHub.find({
            $or: [
                { person_1_id: new ObjectId(student_profile_id) },
                { person_2_id: new ObjectId(student_profile_id) }
            ]
        });
        const total_connections = myConnections.length;

        //location
        const userProfile = await User.findOne({ _id : new ObjectId(student_profile_id) });
        const location = userProfile.location;

        //bio
        const bio = studentProfile.bio_information;

        //full_name
        const full_name = userProfile.first_name + " " + userProfile.last_name;

        //profile_picture
        var profile_picture;
        const filePath = studentProfile.profile_picture
        if (fs.existsSync(filePath)) {
            profile_picture = path.join('C:/Users/insha/FYP-Temp/Backend', filePath);
        }

        //interests
        const interests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        //education
        const education = studentProfile.education ? JSON.parse(studentProfile.education) : [];

        //certifications
        const certifications = studentProfile.certificates ? JSON.parse(studentProfile.certificates) : [];

        //badges
        const badges = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];

        //languages
        const languages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

        success = true;
        res.json({ success, feedback, total_connections, location, bio, full_name,  profile_picture, interests, education, certifications, badges, languages});
    }

    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while returning the profile");
    }
});

module.exports = router