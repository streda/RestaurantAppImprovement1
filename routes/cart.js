import express from "express";
import Order from "../models/order.js"; 
import MenuItem from "../models/menuItemModel.js"; 
import authenticateToken from "../middleware/auth.js"; 

const router = express.Router();

router.post("/add-to-cart", authenticateToken, async (req, res) => {
  const { menuItemId, quantity } = req.body;

  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    await Order.deleteMany({
      userId: req.myUser.userId,
      status: "pending",
      items: { $size: 0 }
    });

    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending"
    });

    if (!order) {
      order = new Order({
        userId: req.myUser.userId,
        items: [],
        status: "pending"
      });
    }

    const existingItemIndex = order.items.findIndex(item =>
      item.menuItem.equals(menuItemId)
    );
    if (existingItemIndex > -1) {
      order.items[existingItemIndex].quantity += quantity;
    } else {
      order.items.push({ menuItem: menuItemId, quantity });
    }

    order.total = order.items.reduce((acc, item) => {
      return acc + item.quantity * menuItem.price;
    }, 0);

    await order.save();
    await order.populate("items.menuItem");


    res.json({ message: "Item added to cart", order });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// 📌 Get User's Cart
router.get("/cart", authenticateToken, async (req, res) => {
  try {
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
      items: { $exists: true, $ne: [] } 
    }).populate("items.menuItem"); 

     if (!order) {
      console.warn("⚠️ No pending order found. Returning an empty cart.");
      return res.json({ order: { items: [] } });
    }

    console.log("Returning fully populated Cart order as JSON Cart from backend:", order);
    res.json({ order: order || { items: [], total: 0 } });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

export default router;