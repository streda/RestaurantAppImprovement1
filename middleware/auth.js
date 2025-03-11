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

    req.myUser = decoded;
    next();
  });
};

export default authenticateToken;