CREATE TABLE IF NOT EXISTS app_users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_algorithm TEXT NOT NULL DEFAULT 'argon2id',
  password_salt TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  created_at BIGINT NOT NULL,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at_db TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_identities (
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_email_provider_idx
  ON auth_identities(provider, lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_uid);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_progress (
  user_uid TEXT PRIMARY KEY REFERENCES app_users(uid) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_vocab (
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  word TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_uid, lang, word)
);
CREATE INDEX IF NOT EXISTS user_vocab_lang_idx ON user_vocab(user_uid, lang);

CREATE TABLE IF NOT EXISTS completions (
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_uid, id)
);
CREATE INDEX IF NOT EXISTS completions_recent_idx ON completions(user_uid, timestamp DESC);

CREATE TABLE IF NOT EXISTS lesson_unlocks (
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  passage_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_uid, lang, passage_id)
);

CREATE TABLE IF NOT EXISTS user_writing (
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  id TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_uid, id)
);

CREATE TABLE IF NOT EXISTS student_summaries (
  user_uid TEXT PRIMARY KEY REFERENCES app_users(uid) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_activity (
  id TEXT PRIMARY KEY,
  student_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS student_activity_recent_idx ON student_activity(student_uid, timestamp DESC);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  teacher_uid TEXT NOT NULL REFERENCES app_users(uid),
  organization_id TEXT,
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS classes_teacher_idx ON classes(teacher_uid);
CREATE INDEX IF NOT EXISTS classes_org_idx ON classes(organization_id);

CREATE TABLE IF NOT EXISTS class_members (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, user_uid)
);
CREATE INDEX IF NOT EXISTS class_members_user_idx ON class_members(user_uid);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_uid TEXT NOT NULL REFERENCES app_users(uid),
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS assignments_class_idx ON assignments(class_id, created_at DESC);

CREATE TABLE IF NOT EXISTS submissions (
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at BIGINT,
  PRIMARY KEY (assignment_id, student_uid)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  uid TEXT REFERENCES app_users(uid),
  paid_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS payments_recent_idx ON payments(paid_at DESC);

CREATE TABLE IF NOT EXISTS smarty_max_invites (
  id TEXT PRIMARY KEY,
  sponsor_uid TEXT NOT NULL REFERENCES app_users(uid),
  invitee_uid TEXT REFERENCES app_users(uid),
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS invites_sponsor_idx ON smarty_max_invites(sponsor_uid);
CREATE INDEX IF NOT EXISTS invites_email_status_idx ON smarty_max_invites(lower(invitee_email), status);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT NOT NULL,
  user_uid TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_uid, id)
);
CREATE INDEX IF NOT EXISTS notifications_recent_idx ON notifications(user_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  author_uid TEXT REFERENCES app_users(uid),
  target_type TEXT,
  target_id TEXT,
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS announcements_target_idx ON announcements(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_uid TEXT REFERENCES app_users(uid),
  timestamp BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS audit_log_recent_idx ON audit_log(timestamp DESC);

CREATE TABLE IF NOT EXISTS cms_content (
  doc_id TEXT PRIMARY KEY,
  updated_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS vocab_misses (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS vocab_misses_count_idx ON vocab_misses(count DESC);

CREATE TABLE IF NOT EXISTS ielts_tests (
  id TEXT PRIMARY KEY,
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ielts_listening_tests (
  id TEXT PRIMARY KEY,
  created_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS shared_vocab_cache (
  id TEXT PRIMARY KEY,
  updated_at BIGINT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tts_cache (
  id TEXT PRIMARY KEY,
  updated_at BIGINT NOT NULL,
  audio_path TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS legacy_firestore_documents (
  path TEXT PRIMARY KEY,
  exported_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  decoded_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
