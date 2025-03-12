import express from "express";
import mongoose from "mongoose"; // Import mongoose for ObjectId conversion
import Order from "../models/order.js";
import Stripe from "stripe";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

// 📌 Create a Stripe Checkout Session
router.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    let order = await Order.findOne({
      userId: req.myUser.userId,
      status: "pending",
      items: { $exists: true, $ne: [] }
    }).populate("items.menuItem");

    if (!order || order.items.length === 0) {
      return res.status(400).json({ error: "Please add items to your order before proceeding to payment" });
    }

    const lineItems = order.items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.menuItem.name },
        unit_amount: Math.round(item.menuItem.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.SERVER_URL}/api/checkout-success?userId=${req.myUser.userId}`,
      cancel_url: `${process.env.SERVER_URL}/checkout-cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 📌 Handle Successful Checkout
router.get("/checkout-success", async (req, res) => {
  const { userId } = req.query;

  console.log("📢 Checkout Success route triggered!");
  console.log(`🔹 Received userId: ${userId}`);

  if (!userId) {
    console.warn("⚠️ No userId provided in checkout-success.");
    return res.redirect("/?paymentSuccess=true");
  }

  try {
    console.log(`🔍 Searching for pending orders for userId: ${userId}`);

    // Convert userId to ObjectId (only if needed)
    const objectIdUserId = new mongoose.Types.ObjectId(userId);

    const pendingOrders = await Order.find({ userId: objectIdUserId, status: "pending" });
    console.log(`📌 Found pending orders: ${pendingOrders.length}`);

    // Find and delete pending orders
    const deleteResult = await Order.deleteMany({ userId: objectIdUserId, status: "pending" });

    console.log(`🗑️ Orders deleted: ${deleteResult.deletedCount}`);

    // ✅ Clear session cart if applicable
    if (req.session) {
      console.log("🛒 Clearing session cart...");
      req.session.cart = null;
    } else {
      console.warn("⚠️ No session detected. Unable to clear session cart.");
    }

    console.log("✅ Cart successfully cleared after checkout.");

    // ✅ Redirect user back to the homepage with a flag
    res.redirect("/?paymentSuccess=true");

  } catch (error) {
    console.error("❌ Error clearing persistent order:", error);
    res.redirect("/?paymentFailed=true");
  }
});


export default router;