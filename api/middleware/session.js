const pool = require("../db/client");

async function requireAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.session_id;
    
    if (!sessionId) {
      return res.status(401).json({ error: "No session found" });
    }

    const result = await pool.query(
      `SELECT 
        u.id, 
        u.email, 
        u.level,
        s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const session = result.rows[0];
    
    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
      return res.status(401).json({ error: "Session expired" });
    }

    // Attach user to request
    req.user = {
      id: session.id,
      email: session.email,
      level: session.level,
    };

    next();
  } catch (err) {
    console.error("Session middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = requireAuth;
