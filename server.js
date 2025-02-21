import open from "open";
import express from "express";
import path from "path";

// import https from "https";
// import fs from "fs";

import { fileURLToPath } from "url"; // Imports the 'fileURLToPath' function from the Node.js 'url' module, and is used to convert a file URL to a file path.
import { dirname } from "path"; // Imports the 'dirname' function from the Node.js 'path' module, and is used to get the directory name of a file path.

import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import "express-async-errors";
import mongoose from "mongoose";
import MenuItem from "./models/menuItemModel.js";
import Order from "./models/order.js";
import User from "./models/userModel.js";

import registerRouter from "./routes/register.js";
import loginRouter from "./routes/login.js";

// const ObjectId = mongoose.Types.ObjectId;  // Ensure you import mongoose at the top of the file

import { calculateTotalPrice } from "./services/orderService.js";
import { error } from "console";
// import * as orderService from './services/orderService.js';

// Initialize dotenv
dotenv.config();
console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);
console.log("Loaded REFRESH_SECRET:", process.env.REFRESH_SECRET);
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);
console.log("Loaded STRIPE_SECRET_KEY :", process.env.STRIPE_SECRET_KEY);

const app = express();

// if (process.env.NODE_ENV === "production") {
//   app.use((req, res, next) => {
//     if (req.headers["x-forwarded-proto"] !== "https") {
//       return res.redirect(`https://${req.hostname}${req.url}`);
//     }
//     next();
//   });
// }

// app.use((req, res, next) => {
//   if (req.headers['x-forwarded-proto'] !== 'https') {
//     return res.redirect(`https://${req.hostname}${req.url}`);
//   }
//   next();
// });


app.use(express.json());
app.use(express.static("public")); // Serving static files normally without {index: false}
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:3000",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Convert import.meta.url to a file path and get the directory name
const __filename = fileURLToPath(import.meta.url); // 'import.meta.url' provides the URL of the current module file and then passed to fileURLToPath() to convert it into file path. Now '__filename' will hold the absolute path to the current module file.
const __dirname = dirname(__filename); // The 'dirname' function is used to extract the directory name from `__filename', which represents the directory containing the current module file. '__dirname' will now hold the absolute path to the directory containing the current module.


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB successfully connected! 🎉"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(registerRouter); 
app.use(loginRouter);

//! Make sure the authenticateToken is defined first before it is used down below.
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       if (err.name === "TokenExpiredError") {
//         console.error("Token expired at:", err.expiredAt);
//         return res.status(401).json({ message: "Token expired" });
//       }
//       console.error("Token verification failed:", err);
//       return res.status(403).json({ message: "Invalid token" });
//     }

//     console.log("Verified User:", decoded);
//     req.myUser = decoded; // Attach decoded token payload (e.g., { userId: user._id }) to the request
//     next();
//   });
// };

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"]; // Fix case insensitivity
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("❌ No token provided in request headers");
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.error("❌ Token expired at:", err.expiredAt);
        return res.status(401).json({ message: "Token expired" });
      }
      console.error("❌ Token verification failed:", err);
      return res.status(403).json({ message: "Invalid token" });
    }

    console.log("✅ Verified User:", decoded);
    req.myUser = decoded;
    next();
  });
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

app.post("/create-checkout-session", async (req, res) => {
  console.log(req.body); // Log the entire body to see what's coming in

  const { items } = req.body; // Ensure items are passed correctly
  if (!items || !items.length) {
    return res
      .status(400)
      .json({ error: "No items provided or incorrect data format." });
  }

  try {
    const lineItems = items.map((item) => {
      if (!item || !item.name) {
        throw new Error("Item details are missing");
      }
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name, // Direct access without .item
          },
          unit_amount: parseInt(item.price * 100), // Assume price is directly on item
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create stripe session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// app.use(authenticateToken);

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
    // order.total += menuItem.price * quantity;
    order.total = order.items.reduce((acc, item) =>{
      return acc + item.quantity + menuItem.price;
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

/* 
    When a user requests to view their cart, the /cart endpoint is called
    Authentication: The request is authenticated using a middleware that verifies the user's token.
    Order Retrieval: The server retrieves the pending order for the user.
    Order Population: The items in the order are populated with details from the MenuItem collection.
    Response: The populated order is sent back to the client.
  */
app.get("/cart", authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    }).populate("items.menuItem");

    console.log('This a the structure of the order:', order);

    if (!order) {
      // return res.status(404).json({ message: "Cart not found" });

      // When a new user logs in, i.e no order is in the cart yet, instead of sending 404 error, send an empty cart structure
      return res.json({order: {items: [], total: 0}});
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

//~ place the following route 

// Serve static files like favicon and webmanifest. This middleware serves all the files in the "public" directory (e.g., HTML, CSS, JS, images) for any matching route. It ensures that requests for static resources like "/index.html", "/styles.css", or "/favicon.ico" are properly resolved.
app.use(express.static(path.join(__dirname, "public")));

// Route all requests to 'index.html' for frontend routing. This catch-all route is necessary for Single Page Applications (SPAs) like React, Angular, or Vue. It ensures that any unmatched routes (e.g., "/about", "/dashboard") are redirected to "index.html". This allows the frontend framework to handle client-side routing and display the appropriate view. Placing this route at the bottom ensures that API routes (defined earlier) take precedence, so requests like "/api/menu-items" are handled by the backend and not routed to "index.html".
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Open the default browser
  await open(`http://localhost:${PORT}`);
});



//^ Replaced by the above code

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


// const PORT = process.env.PORT || 3000;
// app.listen(PORT, "127.0.0.1", () => {
//   console.log(`Server is running on http://127.0.0.1:${PORT}`);
// });
