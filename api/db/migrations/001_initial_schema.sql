-- DanceGPT initial schema
-- Run against the dancegpt database after Postgres is up.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- Users & auth
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  password_hash TEXT      NOT NULL,
  display_name  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Documents (uploaded PDFs / sheets)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,
  ocr_path    TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending',  -- pending | processing | ready | error
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Notes (user-written or AI-generated)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID        REFERENCES documents(id) ON DELETE SET NULL,
  title       TEXT,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Flashcards
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flashcards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        REFERENCES documents(id) ON DELETE CASCADE,
  front       TEXT        NOT NULL,
  back        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_saved_flashcards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id  UUID        NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, flashcard_id)
);

-- ─────────────────────────────────────────
-- Chat
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID        REFERENCES documents(id) ON DELETE SET NULL,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id        ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id       ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id           ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_document_id       ON notes(document_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_document_id  ON flashcards(document_id);
CREATE INDEX IF NOT EXISTS idx_usf_user_id             ON user_saved_flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id   ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session   ON chat_messages(chat_session_id);
