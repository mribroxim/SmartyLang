-- Generated speech audio, shared by all users: each clip is synthesized once.
CREATE TABLE IF NOT EXISTS speech_audio_cache (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  audio BYTEA NOT NULL,
  bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS speech_audio_cache_last_used_idx ON speech_audio_cache (last_used_at);
