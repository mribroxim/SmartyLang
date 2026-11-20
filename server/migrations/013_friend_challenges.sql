CREATE TABLE IF NOT EXISTS friend_challenges (
  id text PRIMARY KEY,
  challenger_uid text NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  friend_uid text NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('quiz', 'spelling', 'match')),
  level text NOT NULL,
  words jsonb NOT NULL,
  challenger_score integer NOT NULL DEFAULT 0,
  challenger_correct integer NOT NULL DEFAULT 0,
  challenger_ms integer NOT NULL DEFAULT 0,
  friend_score integer,
  friend_correct integer,
  friend_ms integer,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'declined')),
  created_at bigint NOT NULL,
  finished_at bigint,
  CHECK (challenger_uid <> friend_uid)
);
CREATE INDEX IF NOT EXISTS friend_challenges_friend ON friend_challenges(friend_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS friend_challenges_challenger ON friend_challenges(challenger_uid, created_at DESC);
