const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart"); // Your Cart model
const authenticateUser = require("../middleware/auth"); // Middleware to get user info

// 📌 Add item to cart (or increase quantity if already exists)
router.post("/add-to-cart", authenticateUser, async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    const userId = req.user.id; // Get user ID from token

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.menuItem.toString() === menuItemId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ menuItem: menuItemId, quantity });
    }

    await cart.save();
    res.json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Get user's cart
router.get("/cart", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from token
    const cart = await Cart.findOne({ user: userId }).populate("items.menuItem");

    if (!cart) {
      return res.json({ order: { items: [] } }); // Return empty cart if not found
    }

    res.json({ order: cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;