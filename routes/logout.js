import express from "express";

const router = express.Router();

// 📌 Logout user
router.get("/", (req, res) => {
  res.clearCookie("sessionToken");
  res.redirect("/login.html");
});

export default router;