const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db/client");
const requireAuth = require("../middleware/session");
const { getAiBaseUrl, aiServiceUrl } = require("../lib/aiServiceUrl");

const router = express.Router();

router.post("/generate", requireAuth, async (req, res) => {
  try {
    const { topic, title, level } = req.body;
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: "topic is required" });
    }
    const examLevel = (level && String(level).trim()) || req.user.level;
    const aiGenerateCardsEndpoint = aiServiceUrl("/ai/study/generate-cards");

    let aiResponse;
    try {
      aiResponse = await fetch(aiGenerateCardsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: String(topic).trim(),
          level: examLevel,
        }),
      });
    } catch (fetchErr) {
      console.error("AI service fetch failed:", fetchErr);
      return res.status(503).json({
        error: `Cannot reach the AI service at ${getAiBaseUrl()}. Expected POST ${aiGenerateCardsEndpoint}.`,
      });
    }

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("AI study error:", aiResponse.status, detail);
      const hint404 =
        aiResponse.status === 404
          ? ` Use AI_SERVICE_URL=http://127.0.0.1:8000 if Docker also uses port 8000. Attempted ${aiGenerateCardsEndpoint}. `
          : " ";
      return res.status(502).json({
        error: `AI service error (${aiResponse.status}).${hint404}`,
      });
    }

    let aiData;
    try {
      aiData = await aiResponse.json();
    } catch {
      return res.status(502).json({ error: "AI service returned invalid JSON." });
    }

    const cardsIn = Array.isArray(aiData.cards) ? aiData.cards : [];
    if (cardsIn.length === 0) {
      return res.status(422).json({
        error: aiData.warning || "No flashcards could be generated for this topic.",
      });
    }

    const deckId = uuidv4();
    const deckTitle =
      (title && String(title).trim()) || `Flashcards: ${String(topic).trim()}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO flashcard_decks (id, user_id, title, level, topic, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [deckId, req.user.id, deckTitle, examLevel, String(topic).trim()]
      );
      for (const card of cardsIn) {
        if (!card || typeof card.front !== "string" || typeof card.back !== "string") {
          continue;
        }
        await client.query(
          `INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at)
           VALUES ($1, $2, $3, $4, 0, NOW())`,
          [uuidv4(), deckId, card.front, card.back]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const cardsResult = await pool.query(
      `SELECT id, front, back, mastery_level, created_at
       FROM deck_cards
       WHERE deck_id = $1
       ORDER BY created_at ASC`,
      [deckId]
    );

    res.status(201).json({
      deck: {
        id: deckId,
        title: deckTitle,
        level: examLevel,
        topic: String(topic).trim(),
      },
      cards: cardsResult.rows,
      warning: aiData.warning || null,
    });
  } catch (err) {
    console.error("Generate flashcards error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/decks", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, level, topic, created_at, updated_at
       FROM flashcard_decks
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json({ decks: result.rows });
  } catch (err) {
    console.error("List decks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/decks/:deckId/cards", requireAuth, async (req, res) => {
  try {
    const deckCheck = await pool.query(
      `SELECT id, title, level, topic FROM flashcard_decks WHERE id = $1 AND user_id = $2`,
      [req.params.deckId, req.user.id]
    );
    if (deckCheck.rows.length === 0) {
      return res.status(404).json({ error: "Deck not found" });
    }
    const result = await pool.query(
      `SELECT id, deck_id, front, back, mastery_level, created_at
       FROM deck_cards
       WHERE deck_id = $1
       ORDER BY created_at ASC`,
      [req.params.deckId]
    );
    res.json({ deck: deckCheck.rows[0], cards: result.rows });
  } catch (err) {
    console.error("List cards error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cards/:cardId/mastery", requireAuth, async (req, res) => {
  try {
    const raw = req.body?.mastery_level;
    const mastery_level = Number(raw);
    if (!Number.isFinite(mastery_level) || mastery_level < 0 || mastery_level > 5) {
      return res
        .status(400)
        .json({ error: "mastery_level must be a number between 0 and 5" });
    }
    const result = await pool.query(
      `UPDATE deck_cards AS d
       SET mastery_level = $1
       FROM flashcard_decks AS f
       WHERE d.id = $2 AND d.deck_id = f.id AND f.user_id = $3
       RETURNING d.id, d.deck_id, d.front, d.back, d.mastery_level, d.created_at`,
      [Math.round(mastery_level), req.params.cardId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Card not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update mastery error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/templates", async (req, res) => {
  try {
    const level = req.query?.level ? String(req.query.level).trim() : "";
    const hasLevel = level.length > 0;
    const result = hasLevel
      ? await pool.query(
          `SELECT id, title, level, topic, created_at
           FROM flashcard_decks
           WHERE is_template = true AND level = $1
           ORDER BY level ASC, topic ASC, title ASC, created_at ASC`,
          [level]
        )
      : await pool.query(
          `SELECT id, title, level, topic, created_at
           FROM flashcard_decks
           WHERE is_template = true
           ORDER BY level ASC, topic ASC, title ASC, created_at ASC`
        );
    res.json({ templates: result.rows });
  } catch (err) {
    console.error("List templates error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/load-template/:id", requireAuth, async (req, res) => {
  try {
    const templateId = req.params.id;
    const templateResult = await pool.query(
      `SELECT id, title, level, topic FROM flashcard_decks WHERE id = $1 AND is_template = true`,
      [templateId]
    );
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }
    const template = templateResult.rows[0];

    const existingCheck = await pool.query(
      `SELECT id FROM flashcard_decks 
       WHERE user_id = $1 AND topic = $2 AND is_template = false`,
      [req.user.id, template.topic]
    );
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "You already have a personal copy of this deck",
        existingDeckId: existingCheck.rows[0].id
      });
    }

    const templateCards = await pool.query(
      `SELECT front, back FROM deck_cards WHERE deck_id = $1 ORDER BY created_at ASC`,
      [templateId]
    );

    const newDeckId = uuidv4();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [newDeckId, req.user.id, template.title, template.level, template.topic]
      );
      for (const card of templateCards.rows) {
        await client.query(
          `INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at)
           VALUES ($1, $2, $3, $4, 0, NOW())`,
          [uuidv4(), newDeckId, card.front, card.back]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const cardsResult = await pool.query(
      `SELECT id, front, back, mastery_level, created_at
       FROM deck_cards
       WHERE deck_id = $1
       ORDER BY created_at ASC`,
      [newDeckId]
    );

    res.status(201).json({
      deck: {
        id: newDeckId,
        title: template.title,
        level: template.level,
        topic: template.topic,
      },
      cards: cardsResult.rows,
    });
  } catch (err) {
    console.error("Load template error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/custom", requireAuth, async (req, res) => {
  try {
    const { title, cards } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: "cards array is required and must not be empty" });
    }

    const validCards = cards.filter(
      (c) => c && typeof c.front === "string" && typeof c.back === "string" && c.front.trim() && c.back.trim()
    );
    if (validCards.length === 0) {
      return res.status(400).json({ error: "No valid cards provided" });
    }

    const deckId = uuidv4();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NULL, false, NOW(), NOW())`,
        [deckId, req.user.id, String(title).trim(), req.user.level]
      );
      for (const card of validCards) {
        await client.query(
          `INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at)
           VALUES ($1, $2, $3, $4, 0, NOW())`,
          [uuidv4(), deckId, card.front.trim(), card.back.trim()]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const cardsResult = await pool.query(
      `SELECT id, front, back, mastery_level, created_at
       FROM deck_cards
       WHERE deck_id = $1
       ORDER BY created_at ASC`,
      [deckId]
    );

    res.status(201).json({
      deck: {
        id: deckId,
        title: String(title).trim(),
        level: req.user.level,
      },
      cards: cardsResult.rows,
    });
  } catch (err) {
    console.error("Create custom deck error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
