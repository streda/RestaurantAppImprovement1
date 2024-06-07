import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({ success: false, message: "" });
    }
    
    //! For debugging purpose
    console.log(`User found: ${user.username}`);
    console.log(`Stored hashed password: ${user.password}`);

    const isMatch = await user.comparePassword(password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
        console.log("Password does not match");
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials." });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Logging out the token in api/login: ", token);
    res.json({ success: true, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;



//   if (!user || user.password !== password) {
//     // Ensure password comparison; consider hashing in production
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid credentials" });
//   }
