import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/order.js';

dotenv.config();
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri).then(async () => {
  const orders = await Order.find({});

  orders.forEach((order, i) => {
    console.log(`\nOrder ${i + 1}:`);
    order.items.forEach(item => {
      console.log("  menuItem:", item.menuItem);
      console.log("  quantity:", item.quantity);
    });
  });

  mongoose.connection.close();
});