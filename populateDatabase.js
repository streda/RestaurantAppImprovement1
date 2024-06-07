import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from './models/menuItemModel.js'; // Ensure this path is correct
import { menuArray } from './public/data.js'; // Adjust the path to where your newData.js is located

dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected for data population!");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
});

const populateDatabase = async () => {
    try {
        await MenuItem.deleteMany(); // Clear existing data
        await MenuItem.insertMany(menuArray); // Insert new data
        console.log("Database populated successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Failed to populate database", error);
        mongoose.connection.close();
    }
};

populateDatabase();
