const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const TeacherProfile = require('../Models/TeacherProfile');
const LearningPosts = require('../Models/LearningPosts');
const LessonItems = require('../Models/LessonItems');
const QuizQuestions = require('../Models/QuizQuestions');
const QuestionAnswers = require('../Models/QuestionAnswers');
const fetchuser = require('../Middlewares/fetchuser');

// Create Quiz

router.post('/CreateQuiz', fetchuser, async (req, res) => {  
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        // Creation of learning post
        const learning_post = await LearningPosts.create({
            title: req.body.title,
            content: req.body.content,
            status: 'published',
            author_user_id: teacher_profile_id,
            post_type: 'quiz'
        });

        const data = {
            post: {
                id: learning_post.id
            }
        }

        success = true;
        res.json({ success, data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: "Some error occurred while creating the quiz" });
    }
});

// Add Quiz To Lesson

router.post('/AddQuiz', fetchuser, async (req, res) => {  
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const lesson_id = req.body.lesson_id;
    const post_id = req.body.post_id;
    const item_order = req.body.item_order;
    const duration = req.body.duration;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        // Creation of lesson item
        const quiz = await LessonItems.create({
            post_id: post_id,
            lesson_id: lesson_id,
            item_order: item_order,
            duration: duration
        });

        const data = {
            post: {
                id: quiz.id
            }
        }

        success = true;
        res.json({ success, data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: "Some error occurred while adding the quiz to a lesson" });
    }
});

//Update Quiz Status

router.put('/UpdateQuizStatus/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const status = req.body.status; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: key});

        if (!post) {
            return res.status(404).json({ success, error: "Quiz not found" });
        }

        post.status = status;
        await post.save();

        success = true;
        res.json({ success, post });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the quiz status");
    }
});

//Update Quiz

router.put('/UpdateQuiz/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { title, content } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const quiz = await LearningPosts.findOne({ _id: new ObjectId(key) });

        if (!quiz) {
            return res.status(404).json({ success, error: "Quiz not found" });
        }

        quiz.title = title;
        quiz.content = content;
        await quiz.save();

        success = true;
        res.json({ success, quiz });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the quiz");
    }
});

//Update Quiz Order

router.put('/UpdateQuizOrder/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { item_order, lesson_id } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const quiz = await LessonItems.findOne({ _id: new ObjectId(key), lesson_id: new ObjectId(lesson_id) });

        if (!quiz) {
            return res.status(404).json({ success, error: "Quiz not found" });
        }

        quiz.item_order = item_order;

        await quiz.save();

        success = true;
        res.json({ success, quiz });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the quiz order in a lesson");
    }
});

//Remove Quiz

router.delete('/RemoveQuiz/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const lesson_id = req.body.lesson_id;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: new ObjectId(key) });

        if (!post) {
            return res.status(404).json({ success, error: "Quiz not found" });
        }

        await LessonItems.deleteMany({ post_id: new ObjectId(key), lesson_id: new ObjectId(lesson_id) });

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while removing the quiz");
    }
});

//Get All Quiz of a lesson

router.get('/GetLessonQuizzes/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const quizzes = await LessonItems.find({lesson_id: new ObjectId(key)}).lean().exec();
        const learningPosts = await LearningPosts.find({
            _id: { $in: quizzes.map(quiz => quiz.post_id) },
            post_type: 'quiz',
            author_user_id: new ObjectId(teacher_profile_id),
        }).lean().exec();

        const quizzesWithLearningPosts = quizzes
            .map(quiz => {
                const matchingLearningPost = learningPosts.find(post => post._id.equals(quiz.post_id));
                return matchingLearningPost ? {
                    post_id: matchingLearningPost._id,
                    title: matchingLearningPost.title,
                    item_order: quiz.item_order,
                } : null;
            })
            .filter(quiz => quiz !== null); // Remove null entries

        success = true;
        res.json({ success, quizzesWithLearningPosts });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching lesson quizzes.");
    }
});

// Get Single Quiz

router.get('/GetSingleQuiz/:key', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success, post });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching single quiz");
    }
});

//Get Quizzes By Status

router.get('/GetQuizzesByStatus', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const status = req.body.status; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const quizzes = await LearningPosts.find({author_user_id: new ObjectId(teacher_profile_id), post_type: 'quiz', status: status}).lean().exec();

        success = true;
        res.json({ success, quizzes });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching quizzes with.");
    }
});

//Get Admin Quizzes

router.get('/GetQuizzes', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const quizzes = await LearningPosts.find({author_user_id: new ObjectId(teacher_profile_id), post_type: 'quiz'}).lean().exec();

        success = true;
        res.json({ success, quizzes });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching quizzes with.");
    }
});

//Delete Quiz

router.delete('/DeleteQuiz/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const post = await LearningPosts.findOne({ _id: new ObjectId(key) });

        if (!post) {
            return res.status(404).json({ success, error: "Quiz not found" });
        }

        const quiz_questions = await QuizQuestions.find({ post_id: new ObjectId(key) });

        await QuestionAnswers.deleteMany({ question_id: new ObjectId(quiz_questions.id) });
        await QuizQuestions.deleteMany({ post_id: new ObjectId(key) });
        await LessonItems.deleteMany({ post_id: new ObjectId(key) });
        await LearningPosts.deleteOne({ _id: new ObjectId(key)});

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the quiz");
    }
});

//Create Question

router.post('/CreateQuestion', fetchuser, async (req, res) => {  
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        // Creation of Question
        const quiz_question = await QuizQuestions.create({
            post_id: req.body.quiz_id,
            content: req.body.content,
            question_order: req.body.order,
            marks: req.body.marks
        });

        const data = {
            question: {
                id: quiz_question.id
            }
        }

        success = true;
        res.json({ success, data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: "Some error occurred while creating the question" });
    }
});

//Update Question

router.put('/UpdateQuestion/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { order, content, marks } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const question = await QuizQuestions.findOne({ _id: new ObjectId(key) });

        if (!question) {
            return res.status(404).json({ success, error: "Question not found" });
        }

        question.question_order = order;
        question.content = content;
        question.marks = marks;

        await question.save();

        success = true;
        res.json({ success, question });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the question");
    }
});

//Delete Question

router.delete('/DeleteQuestion/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const question = await QuizQuestions.findOne({ _id: new ObjectId(key) });

        if (!question) {
            return res.status(404).json({ success, error: "Question not found" });
        }

        await QuestionAnswers.deleteMany({ question_id: new ObjectId(key) });
        await QuizQuestions.deleteOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the question");
    }
});

//Get questions

router.get('/GetQuestions', fetchuser, async (req, res) => {
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const quiz_id = req.body.quiz_id;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const questions = await QuizQuestions.find({ post_id: new ObjectId(quiz_id) }).lean().exec();

        success = true;

        // Create an array to store the questions and their answers
        const questionAnswersArray = [];

        for (const question of questions) {
            const answers = await QuestionAnswers.find({ question_id: question._id }).lean().exec();
            questionAnswersArray.push({ question, answers });
        }

        res.json({ success, questionAnswers: questionAnswersArray });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred while fetching questions with.");
    }
});

//Create answer

router.post('/CreateAnswer', fetchuser, async (req, res) => {  
    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id) });

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        // Creation of Answer
        const answer = await QuestionAnswers.create({
            question_id: req.body.question_id,
            title: req.body.title,
            order: req.body.order,
            is_true: req.body.is_true
        });

        const data = {
            answer: {
                id: answer.id
            }
        }

        success = true;
        res.json({ success, data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: "Some error occurred while creating the answer" });
    }
});

//Edit answer

router.put('/UpdateAnswer/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 
    const { order, title, is_true } = req.body; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const answer = await QuestionAnswers.findOne({ _id: new ObjectId(key) });

        if (!answer) {
            return res.status(404).json({ success, error: "Answer not found" });
        }

        answer.order = order;
        answer.title = title;
        answer.is_true = is_true;

        await answer.save();

        success = true;
        res.json({ success, answer });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while editing the answer");
    }
});

//Delete answer

router.delete('/DeleteAnswer/:key', fetchuser, async (req, res) => {  

    let success = false;
    const teacher_profile_id = req.user.id;
    const ObjectId = mongoose.Types.ObjectId;
    const key = req.params.key; 

    try {
        const teacherProfile = await TeacherProfile.findOne({ teacher_profile_id: new ObjectId(teacher_profile_id)});

        if (!teacherProfile) {
            return res.status(400).json({ success, error: "Teacher profile not found" });
        }

        const answer = await QuestionAnswers.findOne({ _id: new ObjectId(key) });

        if (!answer) {
            return res.status(404).json({ success, error: "answer not found" });
        }

        await QuestionAnswers.deleteOne({ _id: new ObjectId(key) });

        success = true;
        res.json({ success });
    } 
    
    catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occurred while deleting the answer");
    }
});

module.exports = router