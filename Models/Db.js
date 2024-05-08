const mongoose = require('mongoose');
const mongooseURI = 'mongodb+srv://anjiya:helloworld@cluster0.rq0tmnn.mongodb.net/Learnlance?retryWrites=true&w=majority&appName=Cluster0';

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongooseURI);
    console.log("Connected to Mongo Successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = connectToMongo;