import express from "express"; // Import Express framework for routing and handling HTTP requests.
import jwt from "jsonwebtoken"; // Import jsonwebtoken library for generating and verifying JWTs.
import User from "../models/userModel.js"; // Import User model for database operations related to users.
import dotenv from "dotenv"; // Import dotenv library to load environment variables from a .env file.

dotenv.config(); // Load environment variables from .env file into process.env.

const router = express.Router(); // Create a new Express router instance for defining routes.

//! Login route handler
router.post("/api/login", async (req, res) => {
  const { username, password } = req.body; // Extract username and password from the request body.

  try {
    //! Step 1: Find the user by username in the database
    const user = await User.findOne({ username: username });
    if (!user) {
      // If the user is not found, return a 401 Unauthorized response with an error message.
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Debugging logs (optional): Uncomment these to check user details during development
    // console.log(`User found: ${user.username}`);
    // console.log(`Stored hashed password: ${user.password}`);

    //! Step 2: Compare the provided password with the hashed password in the database
    const isMatch = await user.comparePassword(password); // Use custom comparePassword method from the User model.

    // Debugging logs (optional): Uncomment to check if the password matches
    // console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      // If the password doesn't match, return a 401 Unauthorized response with an error message.
      // Debugging: Uncomment to log incorrect password attempts
      // console.log("Password does not match");

      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials." });
    }

    //! Step 3: Generate a JWT (JSON Web Token) for the authenticated user
    const token = jwt.sign(
      { userId: user._id.toString() }, // Payload: Include the user's ID in the token for identification.
      process.env.JWT_SECRET, // Secret key for signing the token (loaded from .env file).
      { expiresIn: "1h" } // Token expiration time (1 hour in this case).
    );

    // Debugging logs (optional): Uncomment to log the generated token
    // console.log("Logging out the token in api/login: ", token);

    //! Step 4: Respond with the token
    res.json({ success: true, token }); // Return a success response with the generated token.
  } catch (error) {
    //! Step 5: Handle any errors that occur during the process
    console.error("Error during login:", error); // Log the error for debugging purposes.

    res.status(500).json({
      success: false,
      message: "Internal server error", // Send a generic error message to the client.
      // Debugging: Uncomment to include the specific error message in the response (not recommended for production).
      // error: error.message,
    });
  }
});

export default router; // Export the router for use in other parts of the application.


/*
* Explanation of Each Step:
	1.	Importing Dependencies:
	•	express: Used for routing and handling HTTP requests.
	•	jsonwebtoken: For generating and verifying JSON Web Tokens.
	•	dotenv: To securely load secret values like JWT_SECRET from a .env file.
	•	User: Mongoose model for interacting with the user data in MongoDB.
	2.	Route Setup:
	•	router.post("/api/login"): Handles POST requests to the /api/login endpoint for user authentication.
	3.	Authentication Logic:
	•	Step 1: Finds the user in the database by username.
	•	Step 2: Compares the password provided by the user with the hashed password stored in the database.
	•	Step 3: Generates a JWT token for the user upon successful authentication. The token includes the user’s ID in the payload and is signed with a secret key (JWT_SECRET) from the .env file. The token expires in 1 hour.
	4.	Error Handling:
	•	Returns appropriate error responses for user not found, invalid credentials, or internal server errors.
	5.	Returning the JWT:
	•	Sends the generated JWT token back to the client if authentication is successful.

*/