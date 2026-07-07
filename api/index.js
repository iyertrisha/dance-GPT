const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});

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
const notesRoutes = require("./routes/notes");
const flashcardsRoutes = require("./routes/flashcards");
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/notes", notesRoutes);
app.use("/flashcards", flashcardsRoutes);

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({ status: "ok", db_time: result.rows[0].time });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

const { getAiBaseUrl } = require("./lib/aiServiceUrl");

app.listen(PORT, () => {
  console.log(`DanceGPT API listening on http://localhost:${PORT}`);
  console.log(`AI service proxy target: ${getAiBaseUrl()} (use 127.0.0.1, not localhost, if port 8000 is shared with Docker)`);
});
