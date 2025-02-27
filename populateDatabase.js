import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from './models/menuItemModel.js'; 
import { menuArray } from './public/data.js'; 

dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
});

const populateDatabase = async () => {
    try {
        await MenuItem.deleteMany(); // Clear existing data
        await MenuItem.insertMany(menuArray); // Insert new data
        mongoose.connection.close();
    } catch (error) {
        console.error("Failed to populate database", error);
        mongoose.connection.close();
    }
};

populateDatabase();
