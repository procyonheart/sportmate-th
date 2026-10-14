-- SportMate TH — initial schema
-- maps from the old Google Sheets layout (tools/apps_script/Code.gs)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email

CREATE TABLE IF NOT EXISTS members (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fullname                 TEXT NOT NULL,
  username                 TEXT NOT NULL UNIQUE,
  email                    CITEXT NOT NULL UNIQUE,
  phone                    TEXT DEFAULT '',
  sports                   TEXT DEFAULT '',
  password_hash            TEXT NOT NULL,
  -- 'argon2' for new/rehashed users, 'sha256' for rows migrated from Sheets
  password_algo            TEXT NOT NULL DEFAULT 'argon2',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  gender                   TEXT DEFAULT '',
  skill_level              TEXT DEFAULT '',
  province                 TEXT DEFAULT '',
  preferred_time           TEXT DEFAULT '',
  verify_token             TEXT,
  is_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  id_verify_status         TEXT NOT NULL DEFAULT 'unverified',
  display_name             TEXT NOT NULL,
  display_name_changed_at  DATE,
  photo_url                TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_members_email ON members (email);
CREATE INDEX IF NOT EXISTS idx_members_verify_token ON members (verify_token);

CREATE TABLE IF NOT EXISTS activities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT NOT NULL REFERENCES members(username) ON DELETE CASCADE,
  sport          TEXT NOT NULL,
  location_name  TEXT NOT NULL,
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  datetime       TIMESTAMPTZ NOT NULL,
  description    TEXT DEFAULT '',
  max_people     INTEGER NOT NULL DEFAULT 1 CHECK (max_people >= 1),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_url      TEXT DEFAULT '',
  display_name   TEXT DEFAULT '',
  privacy        TEXT NOT NULL DEFAULT 'public'
);

CREATE INDEX IF NOT EXISTS idx_activities_datetime ON activities (datetime);
CREATE INDEX IF NOT EXISTS idx_activities_username ON activities (username);

CREATE TABLE IF NOT EXISTS joiners (
  activity_id  UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  username     TEXT NOT NULL REFERENCES members(username) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, username)
);

CREATE TABLE IF NOT EXISTS notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_username  TEXT NOT NULL REFERENCES members(username) ON DELETE CASCADE,
  type                TEXT NOT NULL DEFAULT 'join',
  actor_username      TEXT,
  activity_id         UUID,
  message             TEXT DEFAULT '',
  read                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications (recipient_username, read, created_at);
