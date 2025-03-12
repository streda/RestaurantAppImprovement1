import express from "express";

const router = express.Router();

router.get("/logout", (req, res) => {
  res.clearCookie("sessionToken");
  res.redirect("/login.html");
});

export default router;