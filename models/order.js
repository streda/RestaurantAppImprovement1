import mongoose from "mongoose";

const {Schema, model} = mongoose;

const orderItemSchema = new Schema({
    menuItem: {
        type: Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true
    }, 
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});


const orderSchema = new Schema({
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }, 
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Order = model("Order", orderSchema);

export default Order;