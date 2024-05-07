// require("dotenv").config();

import express from 'express';
import open from 'open';
import path from 'path';
import cors from 'cors'; // CORS (Cross-Origin Resource Sharing) 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

const app = express();
app.use(express.json()); //  parse JSON request bodies
app.use(express.static('public', {index: false})); // serve static files from the public directory Assuming 'public' is the directory containing your HTML files. When you use app.use(express.static('public', {index: false}));, you're telling Express not to automatically serve index.html when a request hits the root URL (/).

app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"], // Allow both localhost and 127.0.0.1
    credentials: true
  })
);

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY_LIVE);

// Integrate Stripe to create checkout sessions, mapping items sent from the frontend into the format expected by Stripe, and handling checkout sessions asynchronously.
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY_TEST);


const stripe = Stripe(process.env.STRIPE_SECRET_KEY_TEST);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body; // Ensure this matches the structure sent from the frontend

    console.log(items); // This will show you the structure of items array sent from frontend

    const lineItems = items.map(item => {
      // Assuming each item has an id, name, price, and quantity
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100, // Convert price to cents
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/index.html`,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// The login route uses jsonwebtoken to issue tokens that can securely represent the user session. This token can be used to maintain user state and authenticate subsequent requests.

// jwt is an abv for (Jason Web Token)

// const jwt = require("jsonwebtoken") 
import jwt from 'jsonwebtoken';

app.post("/api/login", (req, res) => {
  const { username, password} = req.body;
  if(username === "admin" && password === "adminpassword") {

    const token = jwt.sign(
      {
        userId: username
      },

      process.env.JWT_SECRET,

      {
        expiresIn: '1h'
      }
    );

    res.setHeader('Content-Type', 'application/json');

    res.json({
      success: true,
      token
    });
  } 
  
  else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
})


// Redirect the root to login.html
app.get("/", (req, res) => {
  res.redirect('/login.html');
});

app.get("/logout", (req, res) => {
  // Clear session or token. Example with cookie:
  res.clearCookie('sessionToken'); 
  // Redirect to login page
  res.redirect('login.html')
})


// isAuthenticated Middleware (make sure the "cookie-parser" middleware is installed first)
// const cookieParser = require('cookie-parser');
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// isAuthenticated Middleware
function isAuthenticated(req, res, next){
  const token = req.cookies.sessionToken; // Assuming the token is stored in a cookie
  if(token){
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if(err){
        // If token verification fails, redirect to login.html page
        console.log("Token verification failed:", err.message);
        return res.status(401).redirect('/login.html');
      }
      // If token is verified, optionally add decoded information to request for downstream use
      req.user = decoded;
      next();
    })
  } else {
    // Redirect to login.html page if not authenticated
    res.redirect('/login.html');
  }
}

// Route to serve the login page explicitly
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Main application entry point
app.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

// Middleware should be applied to all routes that need user authentication.
// app.use(isAuthenticated); // Apply to all routes if all need protection


// Using environment variables (process.env) for sensitive information (like the Stripe keys and JWT secret) is a best practice that keeps your application's configuration flexible and secure.

// The server is set to listen on port 3000, as specified at the end of your server script. This means all the API requests, whether they are for login, checkout sessions, or static files served from the public directory, are being handled through this port when the server is run locally.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  open(`http://localhost:${PORT}`); // Automatically open the browser when the server starts
});


// app.post("/create-checkout-session", async (req, res) => {
//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: req.body.items.map(item => {
//         const storeItem = storeItems.get(item.id);
//         if (!storeItem) {
//           throw new Error(`Item with ID ${item.id} not found.`);
//         }
//         return {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: storeItem.name,
//             },
//             unit_amount: storeItem.priceInCents,
//           },
//           quantity: item.quantity,
//         };
//       }),
//       success_url: `${process.env.SERVER_URL}/success.html`,
//       cancel_url: `${process.env.SERVER_URL}/cancel.html`
//     });
//     res.json({ url: session.url });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });



// require("dotenv").config();

// const express = require('express');
// const cors = require("cors")
// const app = express();

// // All of the client code is living inside this public folder in the backend Folder
// app.use(express.static('public')); // Serve static files from the public directory
// app.use(express.json());  // For parsing application/json

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// // const YOUR_DOMAIN = 'http://localhost:3000';

// app.post('/create-checkout-session', async (req, res) => {
//   const { orderArray } = req.body; // Assume this contains item details
//   // Convert orderArray to Stripe line items format if necessary
//   const lineItems = orderArray.map(item => ({
//     price_data: {
//       currency: 'usd',
//       product_data: {
//         name: item.name,
//         // Add other product details here
//       },
//       unit_amount: item.price * 100, // Stripe expects amount in cents
//     },
//     quantity: item.quantity,
//   }));

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: lineItems,
//       mode: 'payment',
//       success_url: '${process.env.SERVER_URL}/success.html', // Your success URL
//       cancel_url: '${process.env.SERVER_URL}/cancel.html', // Your cancel URL
//     });

//     res.json({ id: session.id });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// Endpoint to create a Stripe Checkout session
// app.post('/create-checkout-session', async (req, res) => {
//   try {
//     const { items } = req.body; // Your frontend should send the items in the cart

//     // Create line items for Stripe Checkout
//     const lineItems = items.map(item => {
//       return {
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: item.name,
//           },
//           unit_amount: item.price * 100, // Convert price to cents
//         },
//         quantity: item.quantity,
//       };
//     });

//     // Create a Checkout Session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: lineItems,
//       mode: 'payment',
//       success_url: `${process.env.SERVER_URL}/success.html`,
//       cancel_url: `${process.env.SERVER_URL}/cancel.html`
//     });

//     res.json({ url: session.url });
//   } catch (error) {
//     console.error('Error creating Stripe Checkout session:', error.message);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });
