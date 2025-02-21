import mongoose from 'mongoose'; // Import Mongoose library for MongoDB interactions

const Schema = mongoose.Schema; // Alias for mongoose.Schema to define schemas

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
    type: String, // Field type: String
    required: true // Field is mandatory
  },
  ingredients: [String], // Field is an array of strings for item ingredients
  price: { 
    type: Number, // Field type: Number for item price
    required: true // Field is mandatory
  },
  type: { 
    type: String, // Field type: String for item category/type (e.g., pizza, sandwich)
    required: true // Field is mandatory
  },
  emoji: { 
    type: String, // Field type: String for emoji or image path of the item
    required: true // Field is mandatory
  },
  // quantity: {type: Number, required: true, default: 0} // Uncomment this if quantity is required
});

// Create a Mongoose model for the "MenuItem" collection
//! This the syntax: mongoose.model(<CollectionName>, <Schema>)
// This connects the menuItemSchema to the "MenuItem" collection in MongoDB
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Export the MenuItem model for use in other files
export default MenuItem;