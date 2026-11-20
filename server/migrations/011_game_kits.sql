CREATE TABLE IF NOT EXISTS game_kits (
  id TEXT PRIMARY KEY,
  owner_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS game_kits_owner_idx ON game_kits(owner_uid, updated_at DESC);
