import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";

//~ The dotenv. config() function call reads your . env file, parses the contents, and loads them into process. env , making your environment variables available throughout your application.
dotenv.config();

const router = express.Router();

//! Login route
router.post("/login", async (req, res) => { 
  const { username, password } = req.body;

  try {
    //! Step 1: Find the user by username in the MongoDB database
    //  User.findOne({ username }) is a Mongoose query method. Check if a user is registered and exists as a user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    //! Step 2: Compare the provided password with the hashed password in the database
    // If a user is found, find if the password associated with it is the same as the password saved
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    //! Step 3: Generate a JWT (JSON Web Token) for the authenticated user
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    //! Step 4: Respond with the token
    res.json({ success: true, token });
  } catch (error) {
    console.error("Error during login:", error);

    //! Step 5: Handle any errors that occur during the process
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;