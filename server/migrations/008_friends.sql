CREATE TABLE IF NOT EXISTS friend_codes (
  uid text PRIMARY KEY REFERENCES app_users(uid) ON DELETE CASCADE,
  code text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS friendships (
  first_uid text NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  second_uid text NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  requested_by text NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  accepted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (first_uid, second_uid),
  CHECK (first_uid < second_uid),
  CHECK (requested_by IN (first_uid, second_uid))
);
CREATE INDEX IF NOT EXISTS friendships_second ON friendships(second_uid);
