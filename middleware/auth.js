import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Invalid or missing Authorization header:", authHeader);
    return res.status(401).json({ message: "Invalid or missing Authorization header" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token after "Bearer"

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.error("Token expired at:", err.expiredAt);
        return res.status(401).json({ message: "Token expired" });
      }
      console.error("Token verification failed:", err);
      return res.status(403).json({ message: "Invalid token" });
    }

     // myUser is a custom property that is added the the request to specify the current user
    console.log("Decoded JWT:", decoded); // ✅ Check what decoded contains
    req.myUser = decoded;

    //! Or extract the a specific data information

    /* 
        // Attach the extracted user information to the req object:
        req.myUser = {
          userId: userId,
          username: username,
          email: email  // Add any other claims you need
        };
    */
    next();
  });
};

export default authenticateToken;