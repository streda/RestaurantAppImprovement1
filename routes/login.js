// import express from "express"; 
// import jwt from "jsonwebtoken"; 
// import User from "../models/userModel.js"; 
// import dotenv from "dotenv"; 

// dotenv.config(); // Load environment variables from .env file into process.env.

// const router = express.Router(); // Create a new Express router instance for defining routes.

// //! Login route handler
// router.post("/api/login", async (req, res) => {
//   const { username, password } = req.body; // Extract username and password from the request body.

//   try {
//     //! Step 1: Find the user by username in the database
//     const user = await User.findOne({ username: username });
//     if (!user) {
//       // If the user is not found, return an error response
//       return res.status(401).json({ success: false, message: "User not found" });
//     }

//     //! Step 2: Compare the provided password with the hashed password in the database
//     const isMatch = await user.comparePassword(password); // Use custom comparePassword method from the User model
//     if (!isMatch) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Invalid Credentials." });
//     }

//     //! Step 3: Generate a JWT (JSON Web Token) for the authenticated user
//     const token = jwt.sign(
//       { userId: user._id.toString() }, // Payload: Include the user's ID in the token for identification.
//       process.env.JWT_SECRET, // Secret key for signing the token (loaded from .env file).
//       { expiresIn: "1h" } // Token expiration time 
//     );

//     //! Step 4: Respond with the token
//     res.json({ success: true, token }); // Return a success response with the generated token.
//   } catch (error) {
//     //! Step 5: Handle any errors that occur during the process
//     console.error("Error during login:", error); // Log the error for debugging purposes.

//     res.status(500).json({
//       success: false,
//       message: "Internal server error", // Send a generic error message to the client.
//     });
//   }
// });

// export default router; // Export the router for use in other parts of the application.


// import express from "express"; 
// import jwt from "jsonwebtoken"; 
// import User from "../models/userModel.js"; 
// import dotenv from "dotenv"; 

// dotenv.config();

// const router = express.Router();

// // Login route
// router.post("/api/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // Find user in database
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(401).json({ success: false, message: "Invalid username or password" });
//     }

//     // Compare password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Invalid username or password" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id.toString() },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({ success: true, token });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// export default router;

import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Login route
router.post("/login", async (req, res) => { 
  const { username, password } = req.body;

  try {
    // Find user in database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;