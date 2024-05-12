import express from 'express';
import open from 'open';
import path from 'path';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import 'express-async-errors';
import mongoose from 'mongoose';
import MenuItem from './models/menuItemModel.js';
import Order from './models/order.js';
import User from './models/userModel.js'; // Assuming you have created a user model


// import { calculateTotalPrice } from './services/orderService.js';
import * as orderService from './services/orderService.js';

// Initialize dotenv
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static('public'));  // Serving static files normally without {index: false}
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB successfully connected! 🎉"))
.catch(err => console.log(err));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

app.post("/create-checkout-session", async (req, res) => {
    console.log(req.body);  // Log the entire body to see what's coming in

    const { items } = req.body;  // Ensure items are passed correctly
    if (!items || !items.length) {
        return res.status(400).json({ error: "No items provided or incorrect data format." });
    }

    try {
        const lineItems = items.map(item => {
            if (!item || !item.name) {
                throw new Error("Item details are missing");
            }
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name, // Direct access without .item
                    },
                    unit_amount: parseInt(item.price * 100), // Assume price is directly on item
                },
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin}/?success=true`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Failed to create stripe session:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


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


//! Working api/login
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ userId: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});


app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ userId: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});


// Middleware to authenticate and set req.user

//! WORKING authenticateToken FUNCTION
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader); // Debug: Log the Authorization header

    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_STRING

    if (token == null) {
        console.log('Token not found'); // Debug: Log if token not found
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
            return res.status(statusCode).json({ message: "Failed to authenticate token", error: err.message });
        }
        console.log('Decoded User:', user); // Debug: Log the decoded user info
        req.user = user;
        next();
    });
};

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

//         // Fetch the user from the database
//         try {
//             const user = await User.findById(decoded.userId);
//             if (!user) {
//                 return res.status(404).json({ message: "User not found" });
//             }
//             req.user = user;
//             next();
//         } catch (error) {
//             console.error("Database error:", error);
//             res.status(500).send("Internal Server Error");
//         }
//     });
// };


app.use(authenticateToken);

app.post('/add-to-cart', authenticateToken, async (req, res) => {
    console.log('User:', req.user);  // Debug: Log user information
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { menuItemId, quantity } = req.body;

    try {
        const existingOrder = await Order.findOne({ userId: req.user._id, status: 'pending' });
        if (existingOrder) {
            const itemIndex = existingOrder.items.findIndex(item => item.menuItem.equals(menuItemId));
            if (itemIndex > -1) {
                existingOrder.items[itemIndex].quantity += quantity;
            } else {
                existingOrder.items.push({ menuItem: menuItemId, quantity });
            }
            // Recalculate the total price
            existingOrder.total = await calculateTotalPrice(existingOrder.items);
            await existingOrder.save();
        } else {
            const newOrder = new Order({
                userId: req.user._id,
                items: [{ menuItem: menuItemId, quantity }],
                status: 'pending',
                total: await calculateTotalPrice([{ menuItem: menuItemId, quantity }])
            });
            await newOrder.save();
        }

        res.status(201).json({ message: 'Cart updated successfully', order: existingOrder });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Failed to update cart', error: error.message });
    }
});


app.get('/items', async (req, res) => {
    try {
        const items = await MenuItem.find({});
        res.status(200).json(items)
    } catch (error){
        console.log("Failed to retrieve items:", error);
        res.status(500).send("Error retrieving items");
    }
})


function isAuthenticated(req, res, next) {
    const token = req.cookies.sessionToken;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.redirect('/login.html');
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        next();
    }
}

app.get("/", isAuthenticated, (req, res) => {
    if (req.user) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});


app.post('/protected-route', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
});


app.get("/logout", (req, res) => {
    res.clearCookie('sessionToken');
    res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    open(`http://localhost:${PORT}`);
});


