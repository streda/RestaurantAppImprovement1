import express from "express";
import Order from "../models/order.js"; // Import Order model
import authenticateToken from "../middleware/auth.js"; // Middleware for authentication

const router = express.Router();

// 📌 Place an Order (Checkout)
router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    // Find the user's pending order
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
      items: { $exists: true, $ne: [] }
    });

    if (!order) {
      return res.status(400).json({ error: "No items in cart. Please add items before checkout." });
    }

    // Mark the order as "completed"
    order.status = "completed";
    await order.save();

    res.json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// 📌 Get User's Order History
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.myUser.userId,
      status: { $ne: "pending" } // Exclude pending carts
    }).populate("items.menuItem");

    res.json({ orders });
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ error: "Failed to retrieve order history" });
  }
});

// 📌 Update Order Status (Admin or User Cancelling an Order)
router.patch("/update-status/:orderId", authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // Expect "completed" or "cancelled"

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow valid status updates
    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status update" });
    }

    order.status = status;
    await order.save();

    res.json({ message: `Order status updated to '${status}'`, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;