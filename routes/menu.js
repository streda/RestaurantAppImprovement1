import express from "express";
import MenuItem from "../models/menuItemModel.js";

const router = express.Router();

// 📌 Get Menu Items
router.get("/menu-items", async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.status(200).json(items);
  } catch (error) {
    console.error("Failed to retrieve items:", error);
    res.status(500).send("Error retrieving items");
  }
});

export default router;