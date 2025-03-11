import express from "express";
import Order from "../models/order.js"; // Import Order model
import MenuItem from "../models/menuItemModel.js"; // Import MenuItem model
import authenticateToken from "../middleware/auth.js"; // Middleware for authentication

const router = express.Router();

// 📌 Add item to cart
router.post("/add-to-cart", authenticateToken, async (req, res) => {
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

    // Recalculate total price
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

// 📌 Get User's Cart
router.get("/cart", authenticateToken, async (req, res) => {
  try {
    // Find the persistent pending order that actually has items
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
      items: { $exists: true, $ne: [] }
    }).populate("items.menuItem");

    // If no order found, return an empty cart
    res.json({ order: order || { items: [], total: 0 } });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

export default router;