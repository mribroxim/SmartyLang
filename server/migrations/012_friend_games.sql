ALTER TABLE live_word_games
  ALTER COLUMN class_id DROP NOT NULL,
  ADD COLUMN opponent_uid TEXT REFERENCES app_users(uid) ON DELETE CASCADE,
  ADD CONSTRAINT live_word_games_room_type CHECK (
    (class_id IS NOT NULL AND opponent_uid IS NULL) OR
    (class_id IS NULL AND opponent_uid IS NOT NULL AND opponent_uid <> host_uid)
  );

CREATE INDEX live_word_games_opponent_idx ON live_word_games(opponent_uid) WHERE opponent_uid IS NOT NULL;
