const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db/client");
const requireAuth = require("../middleware/session");

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// GET /chat/sessions - List user's chat sessions
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, created_at 
       FROM chat_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ sessions: result.rows });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /chat/sessions - Create new chat session
router.post("/sessions", requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const sessionId = uuidv4();

    const result = await pool.query(
      `INSERT INTO chat_sessions (id, user_id, title, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, title, created_at`,
      [sessionId, req.user.id, title || "New Chat"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /chat/sessions/:id/messages - Get messages for a session
router.get("/sessions/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await pool.query(
      `SELECT id, role, content, created_at 
       FROM chat_messages 
       WHERE chat_session_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /chat/message - Send a message and get AI response
router.post("/message", requireAuth, async (req, res) => {
  try {
    const { content, session_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
      [session_id, req.user.id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Save user message
    const userMessageId = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (id, chat_session_id, role, content, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userMessageId, session_id, "user", content]
    );

    // Get recent message history for context
    const historyResult = await pool.query(
      `SELECT role, content 
       FROM chat_messages 
       WHERE chat_session_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [session_id]
    );

    const history = historyResult.rows.reverse();

    // Call Python AI service
    const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: content,
        level: req.user.level,
        history: history,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();

    // Save assistant message
    const assistantMessageId = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (id, chat_session_id, role, content, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [assistantMessageId, session_id, "assistant", aiData.answer]
    );

    res.json({
      answer: aiData.answer,
      user_message_id: userMessageId,
      assistant_message_id: assistantMessageId,
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
