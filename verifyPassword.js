import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "./models/userModel.js"; // Adjust the path to your User model

// Replace this with the actual username
const username = "admin";
const enteredPassword = "testpassword"; // Change this to what you want to test

async function verifyPassword() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found.");
      return;
    }

    const isMatch = await bcrypt.compare(enteredPassword, user.password);
    if (isMatch) {
      console.log("✅ Password is CORRECT!");
    } else {
      console.log("❌ Password is INCORRECT!");
    }
  } catch (error) {
    console.error("Error verifying password:", error);
  } finally {
    mongoose.connection.close();
  }
}

verifyPassword();

//* Run this Script using:  node verifyPassword.js     in this directory terminal.