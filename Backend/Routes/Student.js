const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const StudentProfile = require('../Models/StudentProfile');
const TeacherProfile = require('../Models/TeacherProfile');
const Codes = require('../Models/Codes');
const SocialHub = require('../Models/SocialHub');
const mongoose=require('mongoose');
const crypto = require('crypto');
const Hirer = require('../Models/Hirer');
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
        res.status(500).send("Some error occurred while uploading profile picture");
    }
});

router.delete('/DeleteProfilePicture', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const profilePictureUrl = studentProfile.profile_picture;

        if (profilePictureUrl) {
            fs.unlink(profilePictureUrl, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success, error: "Error deleting the profile picture" });
                }
            });

            studentProfile.profile_picture = null;
            await studentProfile.save();

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

router.post('/AddFeedback/:student_profile_id/:topic_request_id', fetchuser, [                                                    //Both Adding and Updating Feedback
    body('feedback', 'Enter a valid feedback').isString().isIn(['1', '2', '3', '4', '5'])
], async (req, res) => {

    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const userId = req.user.id;
    const student_profile_id = req.params.student_profile_id
    const topic_request_id = req.params.topic_request_id
    const { feedback } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id : new ObjectId(userId) });
        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }
        
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const currentFeedback = studentProfile.feedback || '';
        const newFeedback = currentFeedback + (currentFeedback ? ' ' : '') + feedback;

        studentProfile.feedback = newFeedback;
        await studentProfile.save();

        const hirer = await Hirer.findOne({ topic_id: new ObjectId(topic_request_id) })
        hirer.status = "Given";
        await hirer.save()

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

        const interestExists = currentInterests.some(interest => interest.title === title);

        if (interestExists) {
            return res.json({ success, error: "Interest with this name already exists" });
        }

        var key = generateUniqueRandomNumber();

        const interestObj = {
            id: key,
            title: title,
            description: description,
        };

        currentInterests.unshift(interestObj);

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

router.delete('/DeleteInterest/:interestKey', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const interestKey = req.params.interestKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const currentInterests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

        const interestIndex = currentInterests.findIndex((interest) => interest.id === interestKey);

        if (interestIndex !== -1) {
            currentInterests.splice(interestIndex, 1);

            studentProfile.interests = JSON.stringify(currentInterests);

            await studentProfile.save();

            const interests = studentProfile.interests ? JSON.parse(studentProfile.interests) : [];

            success = true;
            res.json({ success, interests });
        } 
        else {
            return res.status(404).json({ success, error: "Interest not found" });
        }
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting interest");
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

        const interestExists = interests.some(interest => interest.title === title);

        if (interestExists) {
            return res.json({ success, error: "Interest with this name already exists" });
        }

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
        var end_date = req.body.end_date;
        const grade = req.body.grade;

        if (end_date !== "Present") {
            if(start_date > end_date){
                success = false;
                return res.json({ success, message: "Start date cannot be greater than end date" });
            }
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

router.delete('/DeleteEducation/:educationKey', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const educationKey = req.params.educationKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const currentEducations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

        const educationIndex = currentEducations.findIndex((education) => education.id === educationKey);

        if (educationIndex !== -1) {
            currentEducations.splice(educationIndex, 1);

            studentProfile.education = JSON.stringify(currentEducations);

            await studentProfile.save();

            const educations = studentProfile.education ? JSON.parse(studentProfile.education) : [];

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
        res.status(500).send("Some error occurred while fetching certificates");
    }
});

//BADGES

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

// router.post('/AddBadges', fetchuser, [], async (req, res) => {                                                   //Both Adding and Updating Interests
//     let success = false;
//     const student_profile_id = req.user.id;
//     const ObjectId = mongoose.Types.ObjectId;

//     try {
//         const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id)});

//         if (!studentProfile) {
//             return res.status(400).json({ success, error: "Student profile not found" });
//         }

//         const name = req.body.name;
//         const level = req.body.level;

//         const currentLanguages = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];

//         var key = generateUniqueRandomNumber();

//         const languageObj = {
//             id: key,
//             name: name,
//             level: level,
//         };

//         currentLanguages.unshift(languageObj);

//         studentProfile.badges = JSON.stringify(currentLanguages);

//         await studentProfile.save();

//         const languages = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];

//         success = true;
//         res.json({ success, languages });
//     } 
    
//     catch (error) {
//         console.error(error.message);
//         res.status(500).send("Some error occurred while adding languages");
//     }
// });

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

        currentLanguages.unshift(languageObj);

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

router.delete('/DeleteLanguage/:languageKey', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const languageKey = req.params.languageKey;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const currentLanguages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

        const languageIndex = currentLanguages.findIndex((language) => language.id === languageKey);

        if (languageIndex !== -1) {
            currentLanguages.splice(languageIndex, 1);

            studentProfile.language = JSON.stringify(currentLanguages);

            await studentProfile.save();

            const languages = studentProfile.language ? JSON.parse(studentProfile.language) : [];

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

//GET PROFILE PICTURE

router.get('/GetProfilePicture', fetchuser, async (req, res) => {
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({
            student_profile_id: new ObjectId(student_profile_id),
        });

        if (!studentProfile) {
            return res.status(404).json({ success: false, error: 'Student profile not found' });
        }

        const profilePictureUrl = studentProfile.profile_picture;

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

//GET PROFILE

router.get('/GetProfile', fetchuser, async (req, res) => {
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try{
        const studentProfile = await StudentProfile.findOne({ student_profile_id : new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        if(studentProfile.feedback){
            //feedback
            const feedbackArray = studentProfile.feedback.split(' ').map(Number);
            if (feedbackArray.length > 0) {
                feedback = feedbackArray.reduce((acc, value) => acc + value, 0) / feedbackArray.length;
            }
        }

        //total connections
        const total_connections = studentProfile.total_connections;

        //location
        const userProfile = await User.findOne({ _id : new ObjectId(student_profile_id) });
        const location = userProfile.country;

        //bio
        const bio = studentProfile.bio_information;

        //full_name
        const full_name = userProfile.first_name + " " + userProfile.last_name;

        //profile_picture
        const profile_picture = studentProfile.profile_picture

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