import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/* 
 A sample structure of a single item inside the MenuItem array of objects is as follows 
    [
      {
        name: "Pizza",
        ingredients: ["pepperoni", "mushroom", "mozzarella"],
        id: 0,
        price: 2.5,
        type: "pizza",
        emoji: "./image/pizza.png"
      },
    ]
*/

const menuItemSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  ingredients: [String],
  price: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  emoji: { 
    type: String, 
    required: true 
  },
  // quantity: {type: Number, required: true, default: 0}
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
