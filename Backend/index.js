const express = require('express')
const connectToMongo=require('./Models/Db')
const crypto = require('crypto');
const bodyParser = require('body-parser');
const path = require('path');

const secret = crypto.randomBytes(32).toString('hex');

const app = express()
const port = 3000
var cors = require('cors') 

connectToMongo();

app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/Codes',require('./Routes/Code'))
app.use('/api/User',require('./Routes/User'))
app.use('/api/Student',require('./Routes/Student'))
app.use('/api/SocialHub',require('./Routes/SocialHub'))
app.use('/api/TeacherCourses',require('./Routes/TeacherCourses'))
app.use('/api/TeacherLessons',require('./Routes/TeacherLessons'))
app.use('/api/TeacherTopics',require('./Routes/TeacherTopics'))
app.use('/api/TeacherQuizzes',require('./Routes/TeacherQuizzes'))
app.use('/api/TeacherQuizzes',require('./Routes/TeacherQuizzes'))
app.use('/api/CourseEnrollment',require('./Routes/CourseEnrollment'))
app.use('/api/CourseProgression',require('./Routes/CourseProgression'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})