// import express from "express";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Test server running on http://localhost:${PORT}`);
// });

import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
});