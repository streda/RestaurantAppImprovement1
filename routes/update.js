import express from "express";
import Order from "../models/order.js";
import { calculateTotalPrice } from "../services/orderService.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

router.post("/update-item", authenticateToken, async (req, res) => {
  const { id, action } = req.body;

  try {
    const order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const itemIndex = order.items.findIndex((item) => item.menuItem.equals(id));
    if (itemIndex === -1) return res.status(404).json({ error: "Item not found in order" });

    if (action === "increase") {
      order.items[itemIndex].quantity += 1;
    } else if (action === "decrease") {
      order.items[itemIndex].quantity -= 1;
      if (order.items[itemIndex].quantity <= 0) order.items.splice(itemIndex, 1);
    }

    order.total = await calculateTotalPrice(order.items);
    await order.save();
    await order.populate("items.menuItem");

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;