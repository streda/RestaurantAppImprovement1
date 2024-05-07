import express from 'express';
import open from 'open';
import path from 'path';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

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
        const token = jwt.sign({ userId: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

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
