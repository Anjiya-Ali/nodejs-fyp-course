const mongoose = require('mongoose');
const mongooseURI = 'mongodb://localhost:27017/LearnLance?&directConnection=true';

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongooseURI);
    console.log("Connected to Mongo Successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = connectToMongo;