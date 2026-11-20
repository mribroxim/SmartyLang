CREATE TABLE IF NOT EXISTS live_word_games (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-F0-9]{6}$'),
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  host_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  game JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS live_word_games_host_idx ON live_word_games(host_uid, class_id);
CREATE INDEX IF NOT EXISTS live_word_games_expiry_idx ON live_word_games(expires_at);
