const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const StudentProfile = require('../Models/StudentProfile');
const LearningPosts = require('../Models/LearningPosts');
const Courses = require('../Models/Courses');
const Lessons = require('../Models/Lessons');
const UserItems = require('../Models/UserItems');
const QuizQuestions = require('../Models/QuizQuestions');
const QuestionAnswers = require('../Models/QuestionAnswers');
const LessonItems = require('../Models/LessonItems');
const User = require('../Models/User');
const crypto = require('crypto');
const fs = require('fs');
const fetchuser = require('../Middlewares/fetchuser');

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

async function addCertificate(title,instructor,studentProfile) {
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
}

async function addBadge(name,level,studentProfile) {
    const currentBadges = studentProfile.badges ? JSON.parse(studentProfile.badges) : [];
    
    var key = generateUniqueRandomNumber();
    
    const badgeObj = {
        id: key,
        name: name,
        level: level
    };
    
    currentBadges.unshift(badgeObj);
    studentProfile.badges = JSON.stringify(currentBadges);
    await studentProfile.save();
}

//Get My Courses

router.get('/GetMyCourses', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const mycourses = await UserItems.find({ item_type: 'course', student_id: new ObjectId(student_profile_id) }).lean().exec();
        const courses = await Courses.find({}).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: courses.map(course => course.post_id) }
        }).lean().exec();

        const coursesWithLearningPosts = courses
            .filter(course => mycourses.some(item => item.item_id.equals(course._id)))
                .map(course => {
                const matchingLearningPost = learningPosts.find(post => post._id.equals(course.post_id));
                    return matchingLearningPost ? {
                        _id: course._id,
                        content: matchingLearningPost.content,
                        title: matchingLearningPost.title,
                        featured_image: matchingLearningPost.featured_image,
                    } : null;
            })
            .filter(course => course !== null); // Remove null entries

        success = true;
        res.json({ success, coursesWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching my courses with learning posts.");
    }
});

// Get Single My Course

router.get('/GetMyCourse/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const course = await Courses.findOne({_id: new ObjectId(key)}).lean().exec();
        const learningPost = await LearningPosts.findOne({_id: course.post_id}).lean().exec();

        const courseWithLearningPost = {
            _id: course._id,
            language: course.language,
            duration : course.duration,
            title: learningPost.title,
            featured_image: learningPost.featured_image,
            author_user_id: learningPost.author_user_id,
        };
    
        success = true;
        res.json({ success, courseWithLearningPost });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching my course with learning post.");
    }
});

// Caluclate Course Completion

router.get('/CalculateCourseCompletion/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const lessons = await Lessons.find({ course_id: new ObjectId(key) });

        const topics = await Promise.all(
            lessons.map(async (lesson) => {
                const topics = await LessonItems.find({ lesson_id: new ObjectId(lesson._id) });
                const topicIds = await LearningPosts.find({
                    _id: { $in: topics.map(topic => topic.post_id) },
                    post_type: { $in: ['topic', 'quiz'] },
                }).lean().exec().then((items) => items.map((item) => item._id));

                return topicIds.map((id) => id.toString());
            })
        );

        const allTopics = [].concat(...topics);
        const totalTopics = allTopics.length;

        const completedTopics = await UserItems.find({
            student_id: new ObjectId(student_profile_id),
            item_id: { $in: allTopics.map(id => new ObjectId(id)) },
            status: 'completed',
        });

        const completionPercentage = (completedTopics.length / totalTopics) * 100;
    
        success = true;
        res.json({ success, completionPercentage });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching course percentage.");
    }
});

//Get All Lessons of a course

router.get('/GetLessonsOfCourse/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const lessons = await Lessons.find({course_id: new ObjectId(key)}).sort({ lesson_order: 1 }).lean().exec();

        success = true;
        res.json({ success, lessons });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching lessons.");
    }
});

// Get items of a Lesson

router.get('/GetLessonItems/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const topics = await LessonItems.find({ lesson_id: new ObjectId(key) }).sort({ item_order: 1 }).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: topics.map(topic => topic.post_id) },
            post_type: { $in: ['topic', 'quiz'] },
        }).lean().exec();

        // Fetch status for each topic from userItems
        const userItemStatus = await UserItems.find({
            student_id: new ObjectId(student_profile_id),
            item_id: { $in: topics.map(topic => topic.post_id) },
            item_type: { $in: ['topic', 'quiz'] },
        }).lean().exec();

        const topicsWithLearningPosts = topics
            .map(topic => {
                const matchingLearningPost = learningPosts.find(post => post._id.equals(topic.post_id));
                const matchingUserItem = userItemStatus.find(item => item.item_id.equals(topic.post_id));
                return matchingLearningPost ? {
                    post_type: matchingLearningPost.post_type,
                    post_id: matchingLearningPost._id,
                    title: matchingLearningPost.title,
                    content: matchingLearningPost.content,
                    item_order: topic.item_order,
                    duration: topic.duration,
                    status: matchingUserItem ? matchingUserItem.status : 'locked', 
                } : null;
            })
            .filter(topic => topic !== null); // Remove null entries

        success = true;
        res.json({ success, topicsWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching lesson items.");
    }
});

// Mark Topic Completed

router.put('/MarkTopicCompleted/:key', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const topic = await UserItems.findOne({ item_id: key});
        topic.status = 'completed';
        await topic.save();

        success = true;
        res.json({ success, topic });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while marking topic completed");
    }
});

// Add Topic In Progress

router.put('/AddTopicInProgress/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key;
    let topic;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        // Check if the topic is already in progress for the user
        const existingTopic = await UserItems.findOne({
            student_id: student_profile_id,
            item_id: key,
            item_type: 'topic',
            status: { $in: ['completed', 'in progress'] }
        });

        if (existingTopic) {
            topic = existingTopic
        } 

        else {
            topic = await UserItems.create({
                student_id: student_profile_id,
                item_id: key,
                item_type: 'topic',
                status: 'in progress'
            });
        }

        success = true;
        res.json({ success, topic });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding topic in progress");
    }
});

//Get questions

router.get('/GetQuestions/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const quiz_id = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const questions = await QuizQuestions.find({ post_id: new ObjectId(quiz_id) }).sort({ question_order: 1 }).lean().exec();

        success = true;

        // Create an array to store the questions and their answers
        const questionAnswersArray = [];

        for (const question of questions) {
            const answers = await QuestionAnswers.find({ question_id: question._id }).sort({ order: 1 }).lean().exec();
            questionAnswersArray.push({ question, answers });
        }

        res.json({ success, questionAnswers: questionAnswersArray });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching questions with.");
    }
});

// Add Quiz In Progress

router.put('/AddQuizInProgress/:key', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    let topic;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const existingTopic = await UserItems.findOne({
            student_id: student_profile_id,
            item_id: key,
            item_type: 'quiz',
            status: { $in: ['completed', 'in progress'] }
        });

        if (existingTopic) {
            topic = existingTopic
        } 

        else {
            topic = await UserItems.create({
                student_id: student_profile_id,
                item_id: key,
                item_type: 'quiz',
                status: 'in progress'
            });
        }

        success = true;
        res.json({ success, topic });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while adding quiz in progress");
    }
});

// Add Course Rating

router.put('/AddCourseRating/:key', fetchuser, async (req, res) => {  
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const rating = req.body.rating; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const course = await Courses.findOne({ _id: new ObjectId(key) });

        if (!course) {
            return res.status(404).json({ success, error: "Course not found" });
        }

        const currentFeedback = course.rating || '';
        const newFeedback = currentFeedback + (currentFeedback ? ' ' : '') + rating;
        course.rating = newFeedback;

        await course.save();

        success = true;
        res.json({ success, course });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the course status");
    }
});

// Update Quiz Graduation

router.post('/UpdateQuizGraduation', fetchuser, async (req, res) => {  
    let success = false;
    let badge = 'no badge';
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const quiz_id = req.body.quiz_id; 
    const course_id = req.body.course_id;
    const graduation = req.body.graduation;

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const course = await Courses.findOne({ _id: course_id});

        const quiz = await UserItems.findOne({ item_id: quiz_id});
        const user_course = await UserItems.findOne({ item_id: course_id});
        const post = await LearningPosts.findOne({ _id: course.post_id});

        const user = await User.findOne({ _id: new ObjectId(post.author_user_id) });
        const name = user.first_name + " " + user.last_name;

        if(!quiz.graduation || quiz.graduation == 'fail'){
            if(graduation == 'fail'){
                quiz.graduation = graduation;
                await quiz.save();
            }
            else {
                quiz.graduation = graduation;
                quiz.status = 'completed';
                user_course.status = 'completed';
                await quiz.save();
                await user_course.save();
                addCertificate(post.title, name, studentProfile);

                const passed = await UserItems.find({ graduation: 'pass'});
                const length = passed.length;

                if(length==20){
                    addBadge('Bronze Badge', length, studentProfile);
                    badge = 'bronze';
                }
                if(length==30){
                    addBadge('Silver Badge', length, studentProfile);
                    badge = 'silver';
                }
                if(length==50){
                    addBadge('Golden Badge', length, studentProfile);
                    badge = 'golden';
                }
            }
        }

        success = true;
        res.json({ success, quiz, badge });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while updating quiz graduation");
    }
});

// Get Certificate Details

router.get('/GetCerificateDetails/:key', fetchuser, async (req, res) => {
    let success = false;
    const student_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const studentProfile = await StudentProfile.findOne({ student_profile_id: new ObjectId(student_profile_id) });

        if (!studentProfile) {
            return res.status(400).json({ success, error: "Student profile not found" });
        }

        const course = await Courses.findOne({ _id: key});
        const post = await LearningPosts.findOne({ _id: course.post_id});
        const teacher = await User.findOne({ _id: new ObjectId(post.author_user_id) });
        const student = await User.findOne({ _id: new ObjectId(student_profile_id) });

        const data = {
            details:{
                name: student.first_name + ' ' + student.last_name,
                instructor_name: teacher.first_name + ' ' + teacher.last_name,
                course_title: post.title
            }
        }

        success = true;
        res.json({ success, data });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching certificate details.");
    }
});

module.exports = router;




