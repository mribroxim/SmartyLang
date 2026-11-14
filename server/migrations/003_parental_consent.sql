CREATE TABLE IF NOT EXISTS parental_consents (
  id TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  verification_method TEXT NOT NULL,
  receipt_hash TEXT NOT NULL,
  notice_version INTEGER NOT NULL,
  verified_by TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  child_uid TEXT REFERENCES app_users(uid) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ
);
