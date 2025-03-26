import express from "express";
import Order from "../models/order.js"; 
import MenuItem from "../models/menuItemModel.js"; 
import authenticateToken from "../middleware/auth.js"; 

const router = express.Router();

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
    if (existingItemIndex > -1) { // If the item exists, increment the count 
      order.items[existingItemIndex].quantity += quantity;
    } else {
      // If the "item : []", add the new item by providing its id and its quantity. when we push { menuItem: menuItemId, quantity: quantity }, we're only pushing the ID and quantity. We're relying on the populate() method to later retrieve the full details of the menu item from the menuitems collection when needed, thus ensuring data normalization, efficiency, and consistency.
      order.items.push({ menuItem: menuItemId, quantity: quantity });
    }

    // This recalculates the total to make sure it has the correct result. It loops through each menu items and accumulates the grand total of all items
    order.total = order.items.reduce((acc, item) => {
      return acc + item.quantity * menuItem.price;
    }, 0);

    await order.save();
    await order.populate("items.menuItem");

      // res.json({ message: "Item added to cart", order });
    res.status(200).json({
      message: "Item added to cart",
      success: true,
      order: order, // fully populated from await order.populate(...)
    });

  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});
// 📌 Get User's Cart
router.get("/cart", authenticateToken, async (req, res) => {
  try {
    let order = await Order.findOne({
      // The "myUser" is coming from the authenticateToken() function
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