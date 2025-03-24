import mongoose from "mongoose";

const {Schema, model} = mongoose;

// This "itemSchema" defines the structure for each item within an order.
/* 
 A sample structure of a single order (i.e a single Menu Item) is as follows 
    {
        name: "Pizza",
        ingredients: ["pepperoni", "mushroom", "mozzarella"],
        id: 0,
        price: 2.5,
        type: "pizza",
        emoji: "./image/pizza.png"
    },
*/

//! A schema for number of menu items and their quantity
const itemSchema = new Schema({
    // When you define a schema with a type: Schema.Types.ObjectId and ref: 'MenuItem', you're telling Mongoose that this field represents a reference to another document, in this case the "menuItemSchema" defined in the "menuItemModel.js". To get the actual data for the referenced document, you need to use the populate() method on the query, which is done in the car.js 's /api/cart endpoint.
    menuItem: { //  A reference to a MenuItem data doc in the database
        type: Schema.Types.ObjectId,
        ref: "MenuItem", // tells Mongoose which model to use for population.
        required: true
    }, 
    quantity: { // The number of this specific item in the order.
        type: Number,
        required: true,
        min: 1
    }
});


// orderSchema =>  This schema defines the structure of the whole order for a specific Client/User

const orderSchema = new Schema({
    userId: { //  A reference to a User document. This links the order to the user who created it.
        type: Schema.Types.ObjectId,
        ref: 'User', // This tells Mongoose that userId references the User model
        required: true
    },
    items: [itemSchema], // An array of itemSchema objects. Each item in this array is an instance of the itemSchema
    total: { //The total price of the order.
        type: Number,
        required: true
    },
    status: { // The current status of the order, which can be 'pending', 'completed', or 'cancelled'
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }, 
    created_at: { // The date and time when the order was created. It defaults to the current date and time.
        type: Date,
        default: Date.now
    }
});


//! This creates an Order model from the orderSchema
const Order = model("Order", orderSchema);
export default Order;

//* Alternative way of writing the Order Schema by nesting the menuItems array inside of it 
/* 
const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});
*/