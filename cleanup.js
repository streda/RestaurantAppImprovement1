// cleanUp.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/order.js';
import MenuItem from './models/menuItemModel.js'

dotenv.config();
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri).then(async () => {
  console.log("Connected to MongoDB");

  // Populate menuItem so we can identify nulls
  const orders = await Order.find({}).populate("items.menuItem");

  for (const order of orders) {
    const originalItemCount = order.items.length;

    // Keep only valid items (menuItem is not null)
    order.items = order.items.filter(item => item.menuItem !== null);

    if (order.items.length < originalItemCount) {
      console.log(`Cleaning order ${order._id}: removed ${originalItemCount - order.items.length} invalid items.`);

      // Save the cleaned-up order
      await order.save();
    }
  }

  // Optionally remove orders that are now empty
  const deleted = await Order.deleteMany({ items: { $size: 0 } });
  console.log("Deleted empty orders:", deleted);

  mongoose.connection.close();
});
