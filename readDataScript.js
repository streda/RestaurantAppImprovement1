import mongoose from "mongoose";
import MenuItem from "./models/menuItemModel.js";
import { menuArray } from "./public/data.js";

mongoose.connect('mongodb+srv://restaurantAppUser:ixre4xSJKMlv1IeU@cluster0.ivfrywc.mongodb.net/', {
    userNewUrlParser: true,
    useUnifiedTopology: true,
});

menuArray.forEach(async item => {
    const newItem = new MenuItem(item);
    await newItem.save();
    console.log(`Added: ${item.name}`);
});

console.log("Data import completed");