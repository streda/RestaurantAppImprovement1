import express from "express";
import Order from "../models/order.js";
import { calculateTotalPrice } from "../services/orderService.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

router.post("/remove-item", authenticateToken, async (req, res) => {
  const { id } = req.body;

  try {
    const order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    order.items = order.items.filter((item) => !item.menuItem.equals(id));
    order.total = await calculateTotalPrice(order.items);

    await order.save();
    await order.populate("items.menuItem");

    res.json({ message: "Item removed from order", order });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

export default router;