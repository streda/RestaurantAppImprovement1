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

import registerRouter from "./routes/register.js";
import loginRouter from "./routes/login.js";

import { calculateTotalPrice } from "./services/orderService.js";
// import { error } from "console";

import { createClient } from "redis";
import session from "express-session";
import { RedisStore } from "connect-redis"; // Use the named export

// Initialize dotenv
dotenv.config();

console.log("SERVER_URL:", process.env.SERVER_URL);

// Disable TLS certificate validation in development
// if (process.env.NODE_ENV !== 'production') {
//   process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// }

const app = express();
app.use(express.json());
app.use("/api", registerRouter);
app.use(registerRouter); 
// app.use(loginRouter);
app.use("/api", loginRouter);
app.use(cookieParser());
app.use(express.static("public")); // Serving static files normally without {index: false}


app.use(cors({ origin: ["http://localhost:5005","http://localhost:3000", "http://127.0.0.1:5005", "https://truefood.rest", "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"], credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://truefood.rest",
  "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"
];

// Create Redis client using ES module syntax:
import { createClient } from "redis";
import session from "express-session";
import RedisStore from "connect-redis";

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

// 🔹 Handle uncaught exceptions to prevent Heroku crashes
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});


// const redisClient = createClient({
//   url: process.env.REDIS_URL, // Heroku sets this automatically
//   socket: { 
//     tls: true , // Ensure secure connection
//     rejectUnauthorized: false, // Allow self-signed certificates
//   } 
// });

// redisClient.connect().catch((err) => {
//   console.error("Redis connection error:", err);
// }); 

// // Create Redis store using the named export
// const redisStore = new RedisStore({ client: redisClient, prefix: "session:" });

// // Use session middleware with the Redis store:
// app.use(
//   session({
//     store: redisStore,
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: true, sameSite: "none" }
//   })
// );


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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

app.post("/api/cart", (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  res.json({ cart: req.session.cart });
});

/* ---------------------- ADD-TO-CART ROUTE ---------------------- */
app.post("/add-to-cart", authenticateToken, async (req, res) => {
  const { menuItemId, quantity } = req.body;
  try {
    // Verify the menu item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    // Delete any old pending orders with no items for this user
    await Order.deleteMany({
      userId: req.myUser.userId,
      status: "pending",
      items: { $size: 0 }
    });

    // Find an existing pending order
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending"
    });

    // If no pending order exists, create one
    if (!order) {
      order = new Order({
        userId: req.myUser.userId,
        items: [],
        status: "pending"
      });
    }

    // Check if the item is already in the order
    const existingItemIndex = order.items.findIndex(item =>
      item.menuItem.equals(menuItemId)
    );
    if (existingItemIndex > -1) {
      order.items[existingItemIndex].quantity += quantity;
    } else {
      order.items.push({ menuItem: menuItemId, quantity });
    }

    // Recalculate total (using the current menuItem price for simplicity)
    order.total = order.items.reduce((acc, item) => {
      return acc + item.quantity * menuItem.price;
    }, 0);

    await order.save();
    await order.populate("items.menuItem");

    console.log("Order after saving:", JSON.stringify(order, null, 2));

    res.json({ message: "Item added to cart", order });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

/* ---------------------- GET CART ROUTE ---------------------- */
app.get("/cart", authenticateToken, async (req, res) => {
  try {
    // Find the persistent pending order that actually has items
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
      items: { $exists: true, $ne: [] }
    }).populate("items.menuItem");

    // If no order found, return an empty cart
    if (!order) {
      return res.json({ order: { items: [], total: 0 } });
    }
    res.json({ order });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

/* ---------------------- CREATE CHECKOUT SESSION ROUTE ---------------------- */
app.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    // Always fetch the persistent order from MongoDB
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
      items: { $exists: true, $ne: [] }
    }).populate("items.menuItem");

    if (!order || order.items.length === 0) {
      return res.status(400).json({ error: "Please add items to your order before proceeding to payment" });
    }

    // Build line items from the order
    const lineItems = order.items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.menuItem.name },
        unit_amount: Math.round(item.menuItem.price * 100),
      },
      quantity: item.quantity,
    }));

    const origin = process.env.SERVER_URL; // Should be set to your production URL in .env
 
    const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: lineItems,
  mode: "payment",
  success_url: `${process.env.SERVER_URL}/checkout-success?userId=${req.myUser.userId}`,
  cancel_url: `${process.env.SERVER_URL}/checkout-cancel`,
});

    res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------------------- CHECKOUT SUCCESS ROUTE ---------------------- */
// This route is called after a successful payment
// Since Stripe redirect doesn't include authentication headers, we avoid using authenticateToken here

app.get("/checkout-success", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    console.warn("No userId provided in checkout-success; cannot clear order properly.");
    return res.redirect("/?paymentSuccess=true");
  }

  console.log("Payment successful for user:", userId, ". Clearing persistent order...");

  try {
    // Delete the pending order(s) for that user
    await Order.deleteMany({ userId, status: "pending" });
  } catch (error) {
    console.error("Error clearing persistent order:", error);
  }

  // Clear session cart if available
  req.session.cart = null;

  // Redirect back to the homepage (or a dedicated order confirmation page)
  res.redirect("/?paymentSuccess=true");
});

//************************************************************** */

//************************************************************** */

app.get("/menu-items", async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.status(200).json(items);
  } catch (error) {
    console.error("Failed to retrieve items:", error);
    res.status(500).send("Error retrieving items");
  }
});

app.post("/api/item/update", authenticateToken, async (req, res) => {
  const { id, action } = req.body;
  try {
    const order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const itemIndex = order.items.findIndex((item) => item.menuItem.equals(id));
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in order" });
    }

    if (action === "increase") {
      order.items[itemIndex].quantity += 1;
    } else if (action === "decrease") {
      order.items[itemIndex].quantity -= 1;
      if (order.items[itemIndex].quantity <= 0) {
        order.items.splice(itemIndex, 1); // Remove item if quantity is zero
      }
    }
    // Recalculate the total
    order.total = await calculateTotalPrice(order.items);

    await order.save();
    await order.populate("items.menuItem");

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

app.post("/api/item/remove", authenticateToken, async (req, res) => {
  const { id } = req.body;
  try {
    const order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.items = order.items.filter((item) => !item.menuItem.equals(id));

    // Recalculate the total
    order.total = await calculateTotalPrice(order.items);

    await order.save();
    await order.populate("items.menuItem");

    res.json({ message: "Item removed from order", order });
  } catch (error) {
    console.error("Error removing item from order:", error);
    res.status(500).json({ error: "Failed to remove item from order" });
  }
});

app.post("/update-order/:orderId", authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { items } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.items = items;
    order.total = await calculateTotalPrice(items);
    await order.save();

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("sessionToken");
  res.redirect("/login.html");
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5005; // Heroku dynamically assigns a PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


