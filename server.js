// import open from "open";
import express from "express";
import path from "path";
import { fileURLToPath } from "url"; 
import { dirname } from "path"; 

import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import "express-async-errors";
import mongoose from "mongoose";
import MenuItem from "./models/menuItemModel.js";
import Order from "./models/order.js";
// import User from "./models/userModel.js";

// import authenticateToken from "./middleware/auth.js"; // Ensure correct path

import cartRouter from "./routes/cart.js";
import checkoutRouter from "./routes/checkout.js";
import loginRouter from "./routes/login.js";
import logoutRouter from "./routes/logout.js";
import menuRouter from "./routes/menu.js";
import orderRouter from "./routes/order.js";
import paymentRouter from "./routes/payment.js";
import registerRouter from "./routes/register.js";
import removeRouter from "./routes/remove.js";
import updateRouter from "./routes/update.js";

import { calculateTotalPrice } from "./services/orderService.js";
// import { error } from "console";

import { createClient } from "redis";
import session from "express-session";
import { RedisStore } from "connect-redis"; // Use the named export

// Initialize dotenv
dotenv.config();

console.log("SERVER_URL:", process.env.SERVER_URL);

const app = express();
app.use(express.json());

app.use("/api", loginRouter);
app.use(registerRouter); 
app.use("/api", registerRouter);

app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/login", loginRouter);
app.use("/api/logout", logoutRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", orderRouter); // Register order routes
app.use("/api/payment", paymentRouter);
app.use("/api/register", registerRouter);
app.use("/api/remove", removeRouter);
app.use("/api/update", updateRouter);


app.use(cookieParser());
app.use(express.static("public")); // Serving static files normally without {index: false}


app.use(cors({ origin: ["http://localhost:5005","http://localhost:3000", "http://127.0.0.1:5005", "https://truefood.rest", "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"], credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://truefood.rest",
  "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"
];

// Create Redis client using ES module syntax:
const redisClient = createClient({
  url: process.env.REDIS_URL, // Ensure this is set in Heroku
  socket: { 
    tls: true, // Ensure secure connection
    rejectUnauthorized: false, // Only use this if needed
    reconnectStrategy: (retries) => Math.min(retries * 500, 5000), // Retry logic
  } 
});

// 🔹 Proper error handling to prevent crashes
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis connection closed. Reconnecting...");
  reconnectRedis();
});

async function reconnectRedis() {
  try {
    await redisClient.connect();
    console.log("🔄 Redis reconnected successfully");
  } catch (error) {
    console.error("Redis reconnection failed:", error);
    setTimeout(reconnectRedis, 5000); // Try reconnecting every 5 sec
  }
}

// Connect Redis (ensures proper handling of async connection)
redisClient.connect().catch((err) => {
  console.error("Initial Redis connection error:", err);
  reconnectRedis();
});

// 🔹 Create Redis store with proper handling
const redisStore = new RedisStore({ client: redisClient, prefix: "session:" });

// 🔹 Use session middleware with improved options
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: "none", // Allow cross-site cookies
      httpOnly: true, // Prevent client-side access
    }
  })
);

//* Send periodic keep-alive pings to prevent disconnection. Currently, the app crashes (disconnects) every 5 minutes whenever there is no active user. This happens because I am using Redis low tier plan. To avoid this, I need to dynamically ping the redis instance to mimic as an active user. This will trick the redis from disconnecting and reconnect every 5 minutes.
setInterval(async () => {
  try {
    await redisClient.ping();
    console.log("🔄 Redis keep-alive ping sent");
  } catch (err) {
    console.error("Redis ping failed:", err);
  }
}, 240000); // Send a ping every 4 minutes (before the 5 min timeout)


// 🔹 Handle uncaught exceptions to prevent Heroku crashes
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

if (process.env.NODE_ENV === 'production') {
  app.set("trust proxy", 1); // Trust Heroku or other reverse proxies
}

//  This middleware is checking if the hostname is "truefood.rest" and redirecting otherwise.
// Wrap the redirection middleware so that it only runs in production.
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.hostname !== "truefood.rest") {
      return res.redirect(301, `https://truefood.rest${req.originalUrl}`);
    }
    next();
  });
}

// Block malicious requests targeting WordPress and admin-related paths
app.use((req, res, next) => {
    if (req.path.startsWith('/wp-') || req.path.startsWith('/wordpress') || req.path.startsWith('/admin')) {
        return res.status(403).send('Access Denied');
    }
    next();
});


// Converting import.meta.url to a file path and get the directory name

const __filename = fileURLToPath(import.meta.url); 

const __dirname = dirname(__filename); 


mongoose
  .connect(process.env.MONGO_URI)
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5005; // Heroku dynamically assigns a PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


