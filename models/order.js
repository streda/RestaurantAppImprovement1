import mongoose from "mongoose";

const {Schema, model} = mongoose;

// This "itemSchema" defines the structure for each item within an order.
/* 
 A sample structure of a single order is as follows 
    {
        name: "Pizza",
        ingredients: ["pepperoni", "mushroom", "mozzarella"],
        id: 0,
        price: 2.5,
        type: "pizza",
        emoji: "./image/pizza.png"
    },
*/
const itemSchema = new Schema({
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


// This creates an Order model from the orderSchema
const Order = model("Order", orderSchema);

export default Order;