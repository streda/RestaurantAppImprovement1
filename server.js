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
    credentials: true
}));


const mongoURI = "mongodb+srv://restaurantAppUser:ixre4xSJKMlv1IeU@cluster0.ivfrywc.mongodb.net/"
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));



// Middleware to authenticate and set req.user
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
            console.log('Token verification failed:', err); // Debug: Log the error if token verification fails
            return res.sendStatus(403); // Invalid token
        }
        console.log('Decoded User:', user); // Debug: Log the decoded user info
        req.user = user;
        next();
    });
};


app.use(authenticateToken);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack for debugging
    res.status(500).send('Something broke!'); // Send generic error message to client
});


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



app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ userId: username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" }); // Ensure this is JSON
    }
});

// Example usage within an Express route handler
app.post('/update-order', async (req, res) => {
    try {
        const total = await orderService.calculateTotalPrice(req.body.items);
        // further logic to handle the order update
    } catch (error) {
        res.status(500).send(error.message);
    }
});


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

app.get("/logout", (req, res) => {
    res.clearCookie('sessionToken');
    res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    open(`http://localhost:${PORT}`);
});



// app.post('/update-item', async (req, res) => {
//     const {id, quantity} = req.body;
//     try{
//         const updatedItem = await MenuItem.findByIdAndUpdate(
//             id, 
//             {$set: {quantity: quantity}},
//             {new: true}
//         );
//         if(!updatedItem){
//             return res.status(404).send({message: "Item not found"});
//         }
//         res.status(200).send({message: "Item updated successfully", data: updatedItem});
//     } catch (error){
//         console.error("Error updating item:", error);
//         res.status(500).send({message: "Failed to update item", error: error.message});
//     }
// });

// app.post('/remove-item', async (req, res) => {
    
// });



// app.get('/add-item-form', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'addItem.html'));
// });

// app.post('/add-menu-item', async (req, res) => {
//     const newItem = new MenuItem({
//         name: req.body.name,
//         ingredients: req.body.ingredients,
//         price: req.body.price,
//         type: req.body.type,
//         emoji: req.body.emoji
//     });

//     try {
//         const savedItem = await newItem.save();
//         res.status(201).json(savedItem);
//     } catch(error){
//         res.status(400).json({
//             message: error.message
//         });
//     }
// })


// app.post('/add-to-cart', async (req, res) => {
//     const { menuItemId, quantity } = req.body;

//     try {
//         const existingOrder = await Order.findOne({ userId: req.user._id, status: 'pending' });
//         if (existingOrder) {
//             const itemIndex = existingOrder.items.findIndex(item => item.menuItem.equals(menuItemId));
//             if (itemIndex > -1) {
//                 existingOrder.items[itemIndex].quantity += quantity;
//             } else {
//                 existingOrder.items.push({ menuItem: menuItemId, quantity });
//             }
//             // Recalculate the total price using the imported service
//             existingOrder.total = await orderService.calculateTotalPrice(existingOrder.items);
//             await existingOrder.save();
//         } else {
//             const newOrder = new Order({
//                 userId: req.user._id,
//                 items: [{ menuItem: menuItemId, quantity }],
//                 status: 'pending',
//                 // Calculate the total for a new order
//                 total: await orderService.calculateTotalPrice([{ menuItem: menuItemId, quantity }])
//             });
//             await newOrder.save();
//         }

//         res.status(201).json({ message: 'Cart updated successfully', order: existingOrder });
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).json({ message: 'Failed to update cart', error: error.message });
//     }
// });


