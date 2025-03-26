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
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
});

// Remove duplicate menu items by name
const removeDuplicateItems = (array) => {
    const seenNames = new Set();
    return array.filter(item => {
        if (seenNames.has(item.name)) {
            return false;
        } else {
            seenNames.add(item.name);
            return true;
        }
    });
};

const populateDatabase = async () => {
    try {
        const cleanedMenuArray = removeDuplicateItems(menuArray);
        console.log(`Seeding ${cleanedMenuArray.length} unique menu items...`);

        await MenuItem.deleteMany(); // This deletes all existing menu items
        await MenuItem.insertMany(cleanedMenuArray);

        console.log("Database populated with cleaned menu items.");
        mongoose.connection.close();
    } catch (error) {
        console.error("Failed to populate database", error);
        mongoose.connection.close();
    }
};

populateDatabase();

// ! Then From the root directory run: ```node populateDatabase.js``` to populate the database with the updated data