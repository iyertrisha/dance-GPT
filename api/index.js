require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pool = require("./db/client");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({ status: "ok", db_time: result.rows[0].time });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`DanceGPT API listening on http://localhost:${PORT}`);
});
