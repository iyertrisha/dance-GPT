-- Template deck support: allow nullable user_id for shared template decks.
-- Apply after 002_flashcard_decks.sql.

ALTER TABLE flashcard_decks
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE flashcard_decks
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_template
  ON flashcard_decks(is_template);
