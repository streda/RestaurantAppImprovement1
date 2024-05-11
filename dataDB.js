import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const menuItemSchema = new Schema({
  name: { type: String, required: true },
  ingredients: [String],
  price: { type: Number, required: true },
  type: { type: String, required: true },
  emoji: { type: String, required: true }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
