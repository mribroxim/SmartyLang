CREATE TABLE IF NOT EXISTS push_reminders (
  endpoint text PRIMARY KEY,
  uid text NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  keys jsonb NOT NULL,
  timezone text NOT NULL,
  local_time text NOT NULL,
  last_day date
);
CREATE INDEX IF NOT EXISTS push_reminders_uid ON push_reminders(uid);
