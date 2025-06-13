
import express from "express";
import path from "path";
import { fileURLToPath } from "url"; 
import { dirname } from "path"; 

import cors from "cors";
// import Stripe from "stripe";
import dotenv from "dotenv";
// import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import "express-async-errors";
import mongoose from "mongoose";
// import MenuItem from "./models/menuItemModel.js";
// import Order from "./models/order.js";

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

import { createClient } from "redis";
import session from "express-session";
import { RedisStore } from "connect-redis"; // Use the named export

dotenv.config();


const app = express();
app.use(express.json());

app.use(registerRouter); 

app.use("/api", cartRouter);
app.use("/api", checkoutRouter);
app.use("/api", loginRouter);
app.use("/api", logoutRouter);
app.use("/api", menuRouter);
app.use("/api", orderRouter); 
app.use("/api", paymentRouter);
app.use("/api", registerRouter);
app.use("/api", removeRouter);
app.use("/api", updateRouter);


app.use(cookieParser());
app.use(express.static("public")); 

app.use(cors({ origin: ["http://localhost:5005","http://localhost:3000", "http://127.0.0.1:5005", "https://truefood.world", "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"], credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://truefood.world",
  "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"
];

const redisClient = createClient({
  url: process.env.REDIS_URL, 
  socket: { 
    tls: true, 
    rejectUnauthorized: false, 
    reconnectStrategy: (retries) => Math.min(retries * 500, 5000), 
  } 
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis connection closed. Reconnecting...");
  reconnectRedis();
});

async function reconnectRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis reconnection failed:", error);
    setTimeout(reconnectRedis, 5000); 
  }
}

redisClient.connect().catch((err) => {
  console.error("Initial Redis connection error:", err);
  reconnectRedis();
});

const redisStore = new RedisStore({ client: redisClient, prefix: "session:" });

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "none", 
      httpOnly: true, 
    }
  })
);

setInterval(async () => {
  try {
    await redisClient.ping();
  } catch (err) {
    console.error("Redis ping failed:", err);
  }
}, 240000); 

process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

if (process.env.NODE_ENV === 'production') {
  app.set("trust proxy", 1); 
}

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.hostname !== "truefood.world") {
      return res.redirect(301, `https://truefood.world${req.originalUrl}`);
    }
    next();
  });
}

app.use((req, res, next) => {
    if (req.path.startsWith('/wp-') || req.path.startsWith('/wordpress') || req.path.startsWith('/admin')) {
        return res.status(403).send('Access Denied');
    }
    next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename); 
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


const PORT = process.env.PORT || 5005; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

