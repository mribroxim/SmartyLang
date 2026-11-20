-- One row per player per finished live game, kept after the room itself expires.
CREATE TABLE IF NOT EXISTS live_game_results (
  room_code TEXT NOT NULL,
  game_index INTEGER NOT NULL DEFAULT 0,
  uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  players INTEGER NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_code, game_index, uid)
);
CREATE INDEX IF NOT EXISTS live_game_results_class_idx ON live_game_results(class_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS live_game_results_uid_idx ON live_game_results(uid, finished_at DESC);
