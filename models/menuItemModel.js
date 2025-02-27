import mongoose from 'mongoose'; 

const Schema = mongoose.Schema; 

/* 
 A sample structure of a single item inside the MenuItem array of objects is as follows:
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

// Define a schema for a menu item
const menuItemSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  ingredients: [String], // Field is an array of strings for item ingredients
  price: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, // Field type: String for item category/type (e.g., pizza, sandwich)
    required: true 
  },
  emoji: { 
    type: String, 
    required: true 
  },
});

// Create a Mongoose model for the "MenuItem" collection
// This connects the menuItemSchema to the "MenuItem" collection in MongoDB
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Export the MenuItem model for use in other files
export default MenuItem;