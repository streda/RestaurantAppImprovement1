import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/order.js';
import MenuItem from './models/menuItemModel.js'; // ✅ This registers the schema

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



// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import Order from './models/order.js';

// dotenv.config();

// const mongoUri = process.env.MONGO_URI;

// mongoose.connect(mongoUri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(async () => {
//   console.log("Connected to MongoDB");

//   // Remove only broken items from orders
//   const result = await Order.updateMany(
//     {},
//     { $pull: { items: { menuItem: null } } }
//   );
//   console.log("Cleaned up orders:", result);

//   // Optional: delete empty orders
//   const deleted = await Order.deleteMany({ items: { $size: 0 } });
//   console.log("Deleted empty orders:", deleted);

//   mongoose.connection.close();
// }).catch(err => {
//   console.error("DB connection error", err);
// });