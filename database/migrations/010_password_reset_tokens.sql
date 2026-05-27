-- Migration 010: password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hex of the raw token
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash  ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user_id     ON password_reset_tokens (user_id);
