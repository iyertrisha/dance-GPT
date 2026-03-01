const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db/client");
const requireAuth = require("../middleware/session");

const router = express.Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, level } = req.body;

    if (!email || !password || !level) {
      return res.status(400).json({ error: "Email, password, and level are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, level, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, level, created_at`,
      [uuidv4(), email, passwordHash, level]
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const userResult = await pool.query(
      "SELECT id, email, password_hash, level FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create session (expires in 7 days)
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      `INSERT INTO sessions (id, user_id, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [sessionId, user.id, expiresAt]
    );

    // Set cookie
    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });

    res.json({
      id: user.id,
      email: user.email,
      level: user.level,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const sessionId = req.cookies?.session_id;

    if (sessionId) {
      await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    }

    res.clearCookie("session_id");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    level: req.user.level,
  });
});

module.exports = router;
