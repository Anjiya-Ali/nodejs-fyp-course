const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const TeacherProfile = require("../Models/TeacherProfile");
const StudentProfile = require("../Models/StudentProfile");
const Codes = require("../Models/Codes");
const SocialHub = require("../Models/SocialHub");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
const { body, validationResult } = require("express-validator");

const JWT_SECRET = "@insha@is@a@good@girl@";

const fetchuser = require("../Middlewares/fetchuser");

const generateUniqueRandomNumber = () => {
  const randomBytes = crypto.randomBytes(3);
  const randomNumber = parseInt(randomBytes.toString("hex"), 16) % 100000;
  const filePath = "./used-random-numbers.txt";

  let usedNumbers = [];
  if (fs.existsSync(filePath)) {
    usedNumbers = fs.readFileSync(filePath, "utf8").split(",");
  }

  while (usedNumbers.includes(randomNumber.toString())) {
    const randomBytes = crypto.randomBytes(3);
    const randomNumber = parseInt(randomBytes.toString("hex"), 16) % 100000;
  }

  usedNumbers.push(randomNumber.toString());
  fs.writeFileSync(filePath, usedNumbers.join(","));

  return randomNumber.toString().padStart(5, "0");
};

router.post(
  "/CreateUser",
  [
    body("first_name", "Enter a valid First Name").isLength({ min: 3 }),
    body("last_name", "Enter a valid Last Name").isLength({ min: 3 }),
    body("password", "Enter a valid Password").isLength({ min: 5 }),
    body("email", "Enter a valid Email").isEmail(),
    body("gender", "Select a valid gender").optional().isIn(["Male", "Female"]),
    body("country", "Select a valid country").optional(),
    body("privilege", "Enter a valid privilege")
      .optional()
      .isIn(["Student", "Teacher"]),
  ],
  async (req, res) => {
    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({
            success,
            error: "Sorry! A user with this email already exists",
          });
      }

      let privilegeCode;
      if (req.body.privilege === "Student") {
        privilegeCode = await Codes.findOne({ code: "Student" });
      } else if (req.body.privilege === "Teacher") {
        privilegeCode = await Codes.findOne({ code: "Teacher" });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      const registeringDate = new Date();

      user = await User.create({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password_hash: secPass,
        email: req.body.email,
        dob: req.body.dob,
        gender: req.body.gender,
        country: req.body.country,
        privilege_id: privilegeCode._id,
        RegisteringDate: registeringDate,
        status: "Active",
      });

      if (req.body.privilege === "Student") {
        await StudentProfile.create({
          student_profile_id: user.id,
        });
      } else if (req.body.privilege === "Teacher") {
        await TeacherProfile.create({
          teacher_profile_id: user.id,
        });
      }

      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occured in Create User");
    }
  }
);

router.post(
  "/LoginUser",
  [
    body("password", "Password cannot be blank").exists(),
    body("email", "Enter a valid Email").isEmail(),
  ],
  async (req, res) => {
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
        return res
          .status(200)
          .json({
            success,
            error: "Please try to login with correct credentials",
          });
      }

      const passwordCompare = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!passwordCompare) {
        success = false;
        return res
          .status(200)
          .json({
            success,
            error: "Please try to login with correct credentials",
          });
      }

      if (user.status && user.status === "Deleted") {
        success = false;
        return res.status(200).json({ success, error: "User not exist" });
      }

      const privilegeId = user.privilege_id;

      const code = await Codes.findById(privilegeId);

      if (!code) {
        success = false;
        return res
          .status(400)
          .json({ success, error: "Invalid privilege type" });
      }

      const role = code.code;

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;

      if (role === "Student") {
        const name = user.first_name + " " + user.last_name;
        return res.json({
          success,
          role: "Student",
          authtoken,
          id: user.id,
          name: name,
        });
      } else if (role === "Teacher") {
        const name = user.first_name + " " + user.last_name;
        return res.json({
          success,
          role: "Teacher",
          authtoken,
          id: user.id,
          name: name,
        });
      } else if (role === "Admin") {
        const name = user.first_name + " " + user.last_name;
        return res.json({
          success,
          role: "Admin",
          authtoken,
          id: user.id,
          name: name,
        });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred in Login User");
    }
  }
);

router.post(
  "/ForgotPassword",
  [body("email", "Enter a valid Email").isEmail()],
  async (req, res) => {
    let success = false;
    const email = req.body.email;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        success = false;
        return res.status(200).json({ success, message: "User not found" });
      }

      var code = generateUniqueRandomNumber();

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "advancetourguides@gmail.com",
          pass: "crbvfzyiabzawftb",
        },
      });
      var mailOptions = {
        from: "advancetourguides@gmail.com",
        to: `${email}`,
        subject: "Forget Password - Code Validation",
        text: `Please use this code to get back to your account: ${code}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          success = true;
          res.json({ success, code, message: "Emailed Successfully" });
        }
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred in Forgot Password");
    }
  }
);

router.post(
  "/ValidateCode/:code/:email",
  [body("email", "Enter a valid Email").isEmail()],
  async (req, res) => {
    let success = false;
    const userCode = req.body.code;
    const actualCode = req.params.code;

    try {
      if (userCode != actualCode) {
        success = false;
        return res.status(200).json({ success, message: "Invalid Code" });
      } else {
        success = true;
        return res.json({ success });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred in Code Validation");
    }
  }
);

router.post(
  "/ChangePassword/:email",
  [
    body("password", "Enter a valid Password").isLength({ min: 5 }),
    body("rePassword", "Enter a valid Password").isLength({ min: 5 }),
  ],
  async (req, res) => {
    let success = false;
    const password = req.body.password;
    const rePassword = req.body.rePassword;
    const email = req.params.email;

    try {
      if (password !== rePassword) {
        success = false;
        return res
          .status(200)
          .json({ success, message: "Both the passwords don't match" });
      } else {
        const user = await User.findOne({ email: email });

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(password, salt);

        user.password_hash = secPass;
        user.save();

        success = true;
        return res.json({ success });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred in Code Validation");
    }
  }
);

router.get("/GetProfileForOther/:profileId", fetchuser, async (req, res) => {
  const userId = req.user.id;
  const profileId = req.params.profileId;
  const ObjectId = mongoose.Types.ObjectId;

  try {
    const userProfilee = await User.findOne({ _id: new ObjectId(userId) });
    if (!userProfilee) {
      return res.status(400).json({ success, error: "User profile not found" });
    }

    const user = await User.findOne({ _id: new ObjectId(profileId) });
    if (!user) {
      return res
        .status(400)
        .json({ success, error: "User to Find profile not found" });
    }
    const privilegeId = user.privilege_id;
    const privilegeCode = await Codes.findOne({
      _id: new ObjectId(privilegeId),
    });
    const privilege = privilegeCode.code;

    const privilegeIdMine = userProfilee.privilege_id;
    const privilegeCodeMine = await Codes.findOne({
      _id: new ObjectId(privilegeIdMine),
    });
    const privilegeMine = privilegeCodeMine.code;

    if (privilege === "Student") {
      const studentProfile = await StudentProfile.findOne({
        student_profile_id: new ObjectId(profileId),
      });

      //feedback
      const feedbackArray = studentProfile.feedback
        ? studentProfile.feedback.split(" ").map(Number)
        : [5];
      const feedback =
        feedbackArray.reduce((acc, value) => acc + value, 0) /
        feedbackArray.length;

      //total connections
      const total_connections = studentProfile.total_connections;

      //Status
      var status;
      var statusBool = false;
      if (privilegeMine === "Student") {
        status = await SocialHub.find({
          $or: [
            {
              $and: [
                { person_1_id: new ObjectId(userId) },
                { person_2_id: new ObjectId(profileId) },
                { status: "Accepted" },
              ],
            },
            {
              $and: [
                { person_1_id: new ObjectId(profileId) },
                { person_2_id: new ObjectId(userId) },
                { status: "Accepted" },
              ],
            },
          ],
        });
        statusBool = status.length !== 0 ? "FriendS" : false;

        if (statusBool === false) {
          status = await SocialHub.find({
            $and: [
              { person_1_id: new ObjectId(userId) },
              { person_2_id: new ObjectId(profileId) },
              { status: "Pending" },
            ],
          });

          statusBool = status.length !== 0 ? "PendingS" : false;
        }

        if (statusBool === false) {
          statusBool = "ConnectS";
        }
        if (statusBool === "ConnectS") {
          status = await SocialHub.find({
            $and: [
              { person_1_id: new ObjectId(profileId) },
              { person_2_id: new ObjectId(userId) },
              { status: "Pending" },
            ],
          });
          statusBool = status.length !== 0 ? "Accept?S" : "ConnectS";
        }
      } else if (privilegeMine === "Teacher") {
        statusBool = "None";
      }

      //location
      const userProfile = await User.findOne({ _id: new ObjectId(profileId) });
      const location = userProfile.country;

      //bio
      const bio = studentProfile.bio_information;

      //full_name
      const full_name = userProfile.first_name + " " + userProfile.last_name;

      //profile_picture
      const profile_picture = studentProfile.profile_picture;

      //interests
      const interests = studentProfile.interests
        ? JSON.parse(studentProfile.interests)
        : [];

      //education
      const education = studentProfile.education
        ? JSON.parse(studentProfile.education)
        : [];

      //certifications
      const certifications = studentProfile.certificates
        ? JSON.parse(studentProfile.certificates)
        : [];

      //badges
      const badges = studentProfile.badges
        ? JSON.parse(studentProfile.badges)
        : [];

      //languages
      const languages = studentProfile.language
        ? JSON.parse(studentProfile.language)
        : [];

      success = true;
      res.json({
        success,
        id: profileId,
        statusBool,
        privilege,
        feedback,
        total_connections,
        location,
        bio,
        full_name,
        profile_picture,
        interests,
        education,
        certifications,
        badges,
        languages,
      });
    } else if (privilege === "Teacher") {
      const teacherProfile = await TeacherProfile.findOne({
        teacher_profile_id: new ObjectId(profileId),
      });

      //feedback
      let feedbackArray = [];
      const feedbackss = teacherProfile.feedback
        ? JSON.parse(teacherProfile.feedback)
        : [];
      feedbackss.forEach((feedback) => {
        const parsedFeedback = parseInt(feedback.feedback, 10);
        if (!isNaN(parsedFeedback)) {
          feedbackArray.push(parsedFeedback);
        }
      });
      let feedback = 0;
      if (feedbackArray.length > 0) {
        feedback =
          feedbackArray.reduce((acc, value) => acc + value, 0) /
          feedbackArray.length;
      }
      if (feedback === 0) {
        feedback = 5;
      }

      //feedbacks
      const feedbacks = teacherProfile.feedback
        ? JSON.parse(teacherProfile.feedback)
        : [];

      //total connections
      const total_connections = teacherProfile.total_connections;

      //total followers
      const total_followers = teacherProfile.total_followers;

      //Status
      var status;
      var statusBool = false;
      if (privilegeMine === "Student") {
        status = await SocialHub.find({
          $and: [
            { person_1_id: new ObjectId(profileId) },
            { person_2_id: new ObjectId(userId) },
            { status: "Accepted" },
          ],
        });
        statusBool = status.length !== 0 ? "FollowingS" : "FollowS";
      } else if (privilegeMine === "Teacher") {
        status = await SocialHub.find({
          $or: [
            {
              $and: [
                { person_1_id: new ObjectId(userId) },
                { person_2_id: new ObjectId(profileId) },
                { status: "Accepted" },
              ],
            },
            {
              $and: [
                { person_1_id: new ObjectId(profileId) },
                { person_2_id: new ObjectId(userId) },
                { status: "Accepted" },
              ],
            },
          ],
        });
        statusBool = status.length !== 0 ? "FriendT" : false;

        if (statusBool === false) {
          status = await SocialHub.find({
            $and: [
              { person_1_id: new ObjectId(userId) },
              { person_2_id: new ObjectId(profileId) },
              { status: "Pending" },
            ],
          });

          statusBool = status.length !== 0 ? "PendingT" : false;
        }

        if (statusBool === false) {
          statusBool = "ConnectT";
        }
        if (statusBool === "ConnectT") {
          status = await SocialHub.find({
            $and: [
              { person_1_id: new ObjectId(profileId) },
              { person_2_id: new ObjectId(userId) },
              { status: "Pending" },
            ],
          });
          statusBool = status.length !== 0 ? "Accept?T" : "ConnectT";
        }
      }

      //location
      const userProfile = await User.findOne({ _id: new ObjectId(profileId) });
      const location = userProfile.country;

      //bio
      const bio = teacherProfile.bio_information;

      //full_name
      const full_name = userProfile.first_name + " " + userProfile.last_name;

      //profile_picture
      const profile_picture = teacherProfile.profile_picture;

      //education
      const education = teacherProfile.education
        ? JSON.parse(teacherProfile.education)
        : [];

      //experience
      const experience = teacherProfile.experience
        ? JSON.parse(teacherProfile.experience)
        : [];

      //certifications
      const certifications = teacherProfile.certificates
        ? JSON.parse(teacherProfile.certificates)
        : [];

      //projects
      const projects = teacherProfile.projects
        ? JSON.parse(teacherProfile.projects)
        : [];

      //haw
      const haw = teacherProfile.honors_and_awards
        ? JSON.parse(teacherProfile.honors_and_awards)
        : [];

      //skills
      const skills = teacherProfile.skills
        ? JSON.parse(teacherProfile.skills)
        : [];

      //languages
      const languages = teacherProfile.language
        ? JSON.parse(teacherProfile.language)
        : [];

      success = true;
      res.json({
        success,
        id: profileId,
        statusBool,
        privilege,
        feedback,
        feedbacks,
        total_connections,
        total_followers,
        location,
        bio,
        full_name,
        profile_picture,
        education,
        experience,
        certifications,
        projects,
        haw,
        skills,
        languages,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occurred while returning the profile");
  }
});

router.get("/GetUser/:key", fetchuser, async (req, res) => {
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
    res
      .status(500)
      .send("An error occurred while fetching course with learning post.");
  }
});

router.get(
  "/GetProfilePictureOther/:profileId",
  fetchuser,
  async (req, res) => {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const ObjectId = mongoose.Types.ObjectId;

    try {
      const userProfilee = await User.findOne({ _id: new ObjectId(userId) });
      if (!userProfilee) {
        return res
          .status(400)
          .json({ success, error: "User profile not found" });
      }

      const user = await User.findOne({ _id: new ObjectId(profileId) });
      if (!user) {
        return res
          .status(400)
          .json({ success, error: "User to Find profile not found" });
      }
      const privilegeId = user.privilege_id;
      const privilegeCode = await Codes.findOne({
        _id: new ObjectId(privilegeId),
      });
      const privilege = privilegeCode.code;

      if (privilege === "Student") {
        const studentProfile = await StudentProfile.findOne({
          student_profile_id: new ObjectId(profileId),
        });

        //profile_picture
        const profile_picture = studentProfile.profile_picture;

        success = true;
        res.json({ success, id: profileId, profile_picture });
      } else if (privilege === "Teacher") {
        const teacherProfile = await TeacherProfile.findOne({
          teacher_profile_id: new ObjectId(profileId),
        });

        //profile_picture
        const profile_picture = teacherProfile.profile_picture;

        success = true;
        res.json({ success, id: profileId, profile_picture });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while returning the profile");
    }
  }
);

router.get("/GetAllUsers", fetchuser, async (req, res) => {
  let success = false;
  const id = req.user.id;
  const ObjectId = mongoose.Types.ObjectId;

  try {
    const user = await User.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(400).json({ success, error: "User profile not found" });
    }

    let memberInfo = [];

    const members = await User.find({ _id: { $ne: new ObjectId(id) } });

    for (const member of members) {
      const privilegeId = member.privilege_id;
      const privilegeCode = await Codes.findOne({
        _id: new ObjectId(privilegeId),
      });
      const privilege = privilegeCode.code;

      let mem;

      if (privilege === "Student") {
        mem = await StudentProfile.findOne({ student_profile_id: member._id });
      } else if (privilege === "Teacher") {
        mem = await TeacherProfile.findOne({ teacher_profile_id: member._id });
      } else if (privilege === "Admin"){
        continue
      }
      memberInfo.push({
        id: member._id,
        name: member.first_name + " " + member.last_name,
        bio: mem.bio_information,
        profile_picture: mem.profile_picture,
      });
    }

    success = true;
    res.json({ success, memberInfo });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send("Some error occurred while viewing all users of learnlance");
  }
});

module.exports = router;