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

var admin = require("firebase-admin");

const pathToServiceAccount = path.resolve('service-key.json');
var serviceAccount = require(pathToServiceAccount);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://push-notification-177f8-default-rtdb.firebaseio.com"
});

app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));
app.use('/Uploads', express.static('Uploads'));

app.use('/api/Codes',require('./Routes/Code'))
app.use('/api/User',require('./Routes/User'))
app.use('/api/Student',require('./Routes/Student'))
app.use('/api/Teacher',require('./Routes/Teacher'))
app.use('/api/SocialHub',require('./Routes/SocialHub'))
app.use('/api/TeacherCourses',require('./Routes/TeacherCourses'))
app.use('/api/TeacherLessons',require('./Routes/TeacherLessons'))
app.use('/api/TeacherTopics',require('./Routes/TeacherTopics'))
app.use('/api/TeacherQuizzes',require('./Routes/TeacherQuizzes'))
app.use('/api/TeacherQuizzes',require('./Routes/TeacherQuizzes'))
app.use('/api/CourseEnrollment',require('./Routes/CourseEnrollment'))
app.use('/api/CourseProgression',require('./Routes/CourseProgression'))
app.use('/api/LiveSession',require('./Routes/LiveSession'))
app.use('/api/JointAccount',require('./Routes/JointAccount'))
app.use('/api/Admin',require('./Routes/Admin'))
app.use('/api/ScheduledMeetings',require('./Routes/ScheduledMeetings'))
app.use('/api/Notifications',require('./Routes/Notifications'))
app.use('/api/FirebaseToken',require('./Routes/FirebaseToken'))

app.listen(port, '192.168.0.147',() => {
  console.log(`Example app listening on port ${port}`)
})