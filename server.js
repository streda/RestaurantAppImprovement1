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
app.use(express.static("public")); // Serving static files normally without {index: false}
app.use(cookieParser());
// app.use(registerRouter);
app.use("/api", registerRouter);

app.use(cors({ origin: ["http://localhost:5005","http://localhost:3000", "http://127.0.0.1:5005", "https://truefood.rest", "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"], credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

// "http://localhost:5500",
// "http://127.0.0.1:5500",
const allowedOrigins = [
  "http://localhost:3000",
  "https://truefood.rest",
  "https://truefood-restaurant-app-dced7b5ba521.herokuapp.com"
];

//^ For local testing only
// const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
// const redisClient = createClient({
//   url: redisUrl,
// });
// const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
// const redisClient = createClient({
//   url: redisUrl,
//   socket: redisUrl.startsWith("rediss://")
//     ? { tls: { rejectUnauthorized: false } }
//     : {}
// });

// redisClient.connect().catch((err) => {
//   console.error("Redis connection error:", err);
// });

//! Use the below code for production

// Create Redis client using ES module syntax:

const redisClient = createClient({
  url: process.env.REDIS_URL, // Heroku sets this automatically
  socket: { tls: true }, // Ensure secure connection
});

redisClient.connect().catch((err) => {
  console.error("Redis connection error:", err);
}); 

// Create Redis store using the named export
const redisStore = new RedisStore({ client: redisClient, prefix: "session:" });

// Use session middleware with the Redis store:
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: "none" }
  })
);


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

app.use(registerRouter); 
app.use(loginRouter);

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

app.post("/create-checkout-session", async (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: "No items provided or incorrect data format." });
  }
  
  try {
    req.session.cart = items; // Store cart in session
    
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
    
    // Use req.headers.origin if available, otherwise fall back to process.env.SERVER_URL, or localhost for local testing.
    const origin = req.headers.origin || process.env.SERVER_URL || "http://localhost:5005";
    
    console.log("Creating Stripe session with success URL:", `${origin}/?success=true`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create stripe session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//! Commented out original code 
// app.post("/create-checkout-session", async (req, res) => {
//   const { items } = req.body; 
//   if (!items || !items.length) {
//     return res
//       .status(400)
//       .json({ error: "No items provided or incorrect data format." });
//   }

//   try {
//     req.session.cart = items; // Store cart in session

//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: { name: item.name },
//         unit_amount: parseInt(item.price * 100), 
//       },
//       quantity: item.quantity,
//     }));

//     console.log("Creating Stripe session at", new Date());

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: lineItems,
//       mode: "payment",
//       success_url: `${req.headers.origin}/?success=true`,
//       cancel_url: `${req.headers.origin}/?canceled=true`,
//     });

//     console.log("Stripe session created at", new Date());

//     res.json({ url: session.url });
//   } catch (error) {
//     console.error("Failed to create stripe session:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

app.post("/add-to-cart", authenticateToken, async (req, res) => {
  const { menuItemId, quantity } = req.body;
  try {
    //! Check if the menu item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }
    // The server checks if there's a pending order for the user, and if a pending order exists, it is retrieved
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    });

    // If no pending order exists, a new order is created for the user
    if (!order) {
      order = new Order({
        userId: req.myUser.userId,
        items: [],
        status: "pending",
      });
    }

    if(isNaN(menuItem.price)){
      console.error("Invalid price for menuItem:", menuItem);
      return res.status(400).json({error: "Invalid menu item price"});
    }
    if(isNaN(quantity) || quantity <= 0){
      console.error("Invalid quantity:", quantity);
      return res.status(400).json({error: "Invalid quantity"});
    }
    /* 
        If the item is already in the order, the server uses the retrieved pending order's index and update quantity.
        If the item is not in the order, it is added to the items array.
      */
    const existingItemIndex = order.items.findIndex((item) =>
      item.menuItem.equals(menuItemId)
    );

    if (existingItemIndex > -1) {
      // If this item and its index is found
      order.items[existingItemIndex].quantity += quantity;
    } else {
      order.items.push({ menuItem: menuItemId, quantity });
    }

    //! Update the total price
    order.total = order.items.reduce((acc, item) =>{
      return acc + item.quantity * menuItem.price;
    }, 0);

    //  The updated order is saved back to the database
    await order.save();
    await order.populate("items.menuItem");

    res.json({ message: "Item added to cart", order });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// app.get("/cart", authenticateToken, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       userId: req.myUser.userId,
//       status: "pending",
//     }).populate("items.menuItem");


//     if (!order) {
//       // When a new user logs in, i.e no order is in the cart yet
//       return res.json({order: {items: [], total: 0}});
//     }

//     res.json({ order });
//   } catch (error) {
//     console.error("Error fetching cart:", error);
//     res.status(500).json({ error: "Failed to fetch cart" });
//   }
// });

app.get("/cart", authenticateToken, async (req, res) => {
  try {
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    }).populate("items.menuItem");

    // If user returned from Stripe and cart is empty, restore from session
    if (!order && req.session.cart) {
      order = {
        items: req.session.cart,
        total: req.session.cart.reduce((acc, item) => acc + item.quantity * item.price, 0),
      };
      req.session.cart = null; // Clear session cart after restoring
    }

    if (!order) {
      return res.json({ order: { items: [], total: 0 } });
    }

    res.json({ order });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});


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
// app.listen(PORT, async () => {
//   // Open the default browser
//   await open(`http://localhost:${PORT}`);
// });


