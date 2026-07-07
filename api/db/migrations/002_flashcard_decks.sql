-- Per-user flashcard decks and cards (deck-based study sets).
-- Run after 001_initial_schema.sql. Legacy `flashcards` / `user_saved_flashcards` remain unchanged.

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  level      TEXT NOT NULL,
  topic      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deck_cards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id        UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front          TEXT NOT NULL,
  back           TEXT NOT NULL,
  mastery_level  SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);
