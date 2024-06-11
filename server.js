import express from "express";
// import open from "open"; // Commented out because I am using Heroku to open the application now. 
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
const app = express();
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

// Serve static files like favicon and webmanifest
app.use(express.static(path.join(__dirname, "public")));

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
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res
        .status(403)
        .json({ message: "Failed to authenticate token", error: err.message });
    }
    console.log("Verified User:", decoded);

    //! Note:
    //? req.myUser is only available in route handlers that use the authenticateToken middleware
    req.myUser = decoded; // Assuming decoded token that comes from the login token includes { userId: user._id }
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // open(`http://localhost:${PORT}`);
});

//! For SSL encryption purpose

// const sslOptions = {
//   key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
// };

// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   open(`https://localhost:${PORT}`);
// });

// app.post("/api/login", async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const user = await User.findOne({ username: username });
//     if (!user || user.password !== password) {
//       // Ensure password comparison; consider hashing in production
//       return res
//         .status(401)
//         .json({ success: false, message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { userId: user._id.toString() },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     console.log("Logging out the token in api/login: ", token);
//     res.json({ success: true, token });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Internal server error",
//         error: error.message,
//       });
//   }
// });

// Ensure that the middleware is used only where needed
// app.use('/add-to-cart', authenticateToken);
// app.use('/cart', authenticateToken);
// app.use('/api/item/update', authenticateToken);
// app.use('/api/item/remove', authenticateToken);
// app.use('/update-order', authenticateToken);

// const ObjectId = mongoose.Types.ObjectId;  // Ensure you import mongoose at the top of the file

// Ensure the /add-to-cart endpoint correctly updates the database when items are added.
// app.post('/add-to-cart', authenticateToken, async (req, res) => {
//     console.log('User:', req.myUser);  // Debug: Log user information
//     if (!req.myUser|| !req.myUser.userId) {
//         console.log('Authorization failure: No user ID present');
//         return res.status(401).json({ message: 'Not authenticated' });
//     }

//     const { menuItemId, quantity } = req.body;
//     console.log(`Attempting to add item ${menuItemId} with quantity ${quantity}`);

//     //!
//     const userId = req.user.userId;

//     try {
//         // Convert userId and menuItemId from string to ObjectId
//         const userId = new ObjectId(req.user.userId);
//         const menuItemObjectId = new ObjectId(menuItemId);  // Convert menuItemId to ObjectId

//         let existingOrder = await Order.findOne({ userId: userId, status: 'pending' });
//         if (existingOrder) {
//             const itemIndex = existingOrder.items.findIndex(item => item.menuItem.equals(menuItemObjectId));
//             if (itemIndex > -1) {
//                 existingOrder.items[itemIndex].quantity += quantity;
//             } else {
//                 // Ensure the push uses menuItemObjectId
//                 existingOrder.items.push({ menuItem: menuItemObjectId, quantity });
//             }
//             existingOrder.total = await calculateTotalPrice(existingOrder.items);
//             await existingOrder.save();
//             console.log('Order updated successfully:', existingOrder);
//             res.status(201).json({ message: 'Cart updated successfully', order: existingOrder });
//         } else {
//             console.log('No existing order found; creating new order');
//             // Ensure the new order creation uses menuItemObjectId
//             const newOrder = new Order({
//                 userId: userId,
//                 items: [{ menuItem: menuItemObjectId, quantity }],
//                 status: 'pending',
//                 total: await calculateTotalPrice([{ menuItem: menuItemObjectId, quantity }])
//             });
//             await newOrder.save();
//             console.log('New order created:', newOrder);
//             res.status(201).json({ message: 'New order created', order: newOrder });
//         }
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).json({ message: 'Failed to update cart', error: error.message });
//     }
// });

// app.post('/add-to-cart', authenticateToken, async (req, res) => {
//     console.log('User:', req.user);  // Debug: Log User information
//     if (!req.myUser || !req.myUser.userId) {
//         console.log('Authorization failure: No user ID present');
//         return res.status(401).json({ message: 'Not authenticated' });
//     }

//     const { menuItemId, quantity } = req.body;
//     console.log(`Attempting to add item ${menuItemId} with quantity ${quantity}`);

//     try {
//         // Convert userId from string to ObjectId
//         const userId = new ObjectId(req.myUser.userId);

//         const existingOrder = await Order.findOne({ userId: userId, status: 'pending' });
//         if (existingOrder) {
//             const itemIndex = existingOrder.items.findIndex(item => item.menuItem.equals(menuItemId));
//             if (itemIndex > -1) {
//                 existingOrder.items[itemIndex].quantity += quantity;
//             } else {
//                 existingOrder.items.push({ menuItem: menuItemId, quantity });
//             }
//             existingOrder.total = await calculateTotalPrice(existingOrder.items);
//             await existingOrder.save();
//             console.log('Order updated successfully:', existingOrder);
//             res.status(201).json({ message: 'Cart updated successfully', order: existingOrder });
//         } else {
//             console.log('No existing order found; creating new order');
//             const newOrder = new Order({
//                 userId: userId,
//                 items: [{ menuItem: menuItemId, quantity }],
//                 status: 'pending',
//                 total: await calculateTotalPrice([{ menuItem: menuItemId, quantity }])
//             });
//             await newOrder.save();
//             console.log('New order created:', newOrder);
//             res.status(201).json({ message: 'New order created', order: newOrder });
//         }
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).json({ message: 'Failed to update cart', error: error.message });
//     }
// });

// app.post("/api/register", async (req, res) => {
//     const { username, password } = req.body;

//     // Optionally, hash the password before storing it
//     const hashedPassword = password; // Use a hashing library like bcrypt in production

//     const newUser = new User({
//         username,
//         password: hashedPassword
//     });

//     try {
//         await newUser.save();
//         res.status(201).json({ message: "User registered successfully" });
//     } catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({ message: "Failed to register user", error: error.message });
//     }
// });

// //! Working api/login
// app.post("/api/login", async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
//             const token = jwt.sign({ userId: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
//             console.log("Logging out the token in api/login: " , token)
//             res.json({ success: true, token });
//         } else {
//             res.status(401).json({ success: false, message: "Invalid credentials" });
//         }
//     } catch (error) {
//         console.error("Error during login:", error);
//         res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//     }
// });

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     console.log('Auth Header:', authHeader); // Debug: Log the Authorization header

//     if (!authHeader) {
//         console.log('No Authorization header present.');
//         return res.status(401).json({ message: 'Authorization header is required' });
//     }

//     const token = authHeader.split(' ')[1]; // Assume Bearer schema

//     if (!token) {
//         console.log('Token not found in the header.');
//         return res.sendStatus(401);
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             console.log('Token verification failed:', err);
//             const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
//             return res.status(statusCode).json({ message: "Failed to authenticate token", error: err.message });
//         }
//         console.log('decoded User:', user);
//         req.myUser= user;
//         next();
//     });
// };

// console.log("Logging out token before the /add-to-cart api" , token)
// user._id

// app.get('/items', async (req, res) => {
//     try {
//         const items = await MenuItem.find({});
//         res.status(200).json(items)
//     } catch (error){
//         console.log("Failed to retrieve items:", error);
//         res.status(500).send("Error retrieving items");
//     }
// })

// function isAuthenticated(req, res, next) {
//     const token = req.cookies.sessionToken;
//     if (token) {
//         jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//             if (err) {
//                 res.redirect('/login.html');
//             } else {
//                 req.myUser= decoded;
//                 next();
//             }
//         });
//     } else {
//         next();
//     }
// }

// app.get("/", isAuthenticated, (req, res) => {
//     if (req.myUser) {
//         res.sendFile(path.join(__dirname, 'public', 'index.html'));
//     } else {
//         res.sendFile(path.join(__dirname, 'public', 'login.html'));
//     }
// });

// app.post('/protected-route', authenticateToken, (req, res) => {
//     res.json({ message: 'This is a protected route' });
// });

// app.post('/add-to-cart', authenticateToken, async (req, res) => {
//     console.log('Received Auth Header:', req.headers['authorization']);  // Log the Authorization header received
//     console.log('User:', req.user);  // Debug: Log user information
//     if (!req.myUser || !req.myUser._id) {
//         return res.status(401).json({ message: 'Not authenticated' });
//     }

//     const { menuItemId, quantity } = req.body;

//     try {
//         const existingOrder = await Order.findOne({ userId: req.myUser._id, status: 'pending' });
//         if (existingOrder) {
//             const itemIndex = existingOrder.items.findIndex(item => item.menuItem.equals(menuItemId));
//             if (itemIndex > -1) {
//                 existingOrder.items[itemIndex].quantity += quantity;
//             } else {
//                 existingOrder.items.push({ menuItem: menuItemId, quantity });
//             }
//             // Recalculate the total price
//             existingOrder.total = await calculateTotalPrice(existingOrder.items);
//             await existingOrder.save();
//         } else {
//             const newOrder = new Order({
//                 userId: req.user._id,
//                 items: [{ menuItem: menuItemId, quantity }],
//                 status: 'pending',
//                 total: await calculateTotalPrice([{ menuItem: menuItemId, quantity }])
//             });
//             await newOrder.save();
//         }

//         res.status(201).json({ message: 'Cart updated successfully', order: existingOrder });
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).json({ message: 'Failed to update cart', error: error.message });
//     }
// });

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) {
//         console.log('Token not found');
//         return res.sendStatus(401);
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             console.log('Token verification error:', err.message);
//             return res.status(403).json({ message: "Failed to authenticate token", error: err.message });
//         }

//         const currentTime = Math.floor(Date.now() / 1000);
//         console.log('Current Time:', currentTime, 'Token Expires:', user.exp);

//         if (user.exp < currentTime) {
//             console.log('Token has expired');
//             return res.status(401).json({ message: "Token has expired" });
//         }

//         console.log('decoded User:', user);
//         req.myUser= user;
//         next();
//     });
// };

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     console.log('Auth Header:', authHeader); // Debug: Log the Authorization header

//     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_STRING
//     console.log("Logging out the token in authenticateToken() function: " , token)

//     if (token == null) {
//         console.log('Token not found'); // Debug: Log if token not found
//         return res.sendStatus(401);
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
//             console.log('Token verification error:', err.message); // Add this to see the specific error
//             return res.status(statusCode).json({ message: "Failed to authenticate token", error: err.message });
//         }
//         console.log('decoded User:', user); // Debug: Log the decoded user info
//         req.myUser= user;
//         next();
//     });
// };

// Middleware to authenticate and set req.user

//! WORKING authenticateToken FUNCTION
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     console.log('Auth Header:', authHeader); // Debug: Log the Authorization header

//     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_STRING

//     if (token == null) {
//         console.log('Token not found'); // Debug: Log if token not found
//         return res.sendStatus(401);
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
//             return res.status(statusCode).json({ message: "Failed to authenticate token", error: err.message });
//         }
//         console.log('decoded User:', user); // Debug: Log the decoded user info
//         req.myUser= user;
//         next();
//     });
// };

// app.post("/api/login", async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const user = await User.findOne({ username });
//         if (!user) {
//             return res.status(401).json({ success: false, message: "Invalid credentials" });
//         }

//         // Here, you'd compare the hashed password. Assuming plain text for simplicity here:
//         if (password === user.password) {
//             const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//             res.json({ success: true, token });
//         } else {
//             res.status(401).json({ success: false, message: "Invalid credentials" });
//         }
//     } catch (error) {
//         console.error("Error during login:", error);
//         res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//     }
// });

// app.post("/api/login", async (req, res) => {
//     const { username, password } = req.body;
//     if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
//         const token = jwt.sign({ userId: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         res.json({ success: true, token });
//     } else {
//         res.status(401).json({ success: false, message: "Invalid credentials" });
//     }
// });

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) {
//         return res.sendStatus(401);
//     }

//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//         if (err) {
//             return res.status(403).json({ message: "Failed to authenticate token", error: err.message });
//         }

//         // Fetch the User from the database
//         try {
//             const user = await User.findById(decoded.userId);
//             if (!user) {
//                 return res.status(404).json({ message: "User not found" });
//             }
//             req.myUser= user;
//             next();
//         } catch (error) {
//             console.error("Database error:", error);
//             res.status(500).send("Internal Server Error");
//         }
//     });
// };
