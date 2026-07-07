const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db/client");
const requireAuth = require("../middleware/session");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, created_at, updated_at
       FROM notes
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error("List notes error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (content == null || String(content).trim() === "") {
      return res.status(400).json({ error: "content is required" });
    }
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, title, content, created_at, updated_at`,
      [id, req.user.id, title != null ? String(title) : null, String(content)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, created_at, updated_at
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get note error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (content == null || String(content).trim() === "") {
      return res.status(400).json({ error: "content is required" });
    }
    const result = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, content, created_at, updated_at`,
      [title != null ? String(title) : null, String(content), req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
