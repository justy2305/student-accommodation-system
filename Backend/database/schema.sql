-- ==========================================================================
-- FindMyhome: Student Accommodation System, database schema (PostgreSQL)
--
-- Every column here matches what the backend queries in src/models and
-- src/controllers. Run it with:  npm run db:setup   (from the Backend folder)
-- Safe to run more than once: existing tables and their data are kept.
-- ==========================================================================

-- Users: students
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,             -- bcrypt hash, never plain text
  phone       VARCHAR(30),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Every account is a student account, so the old role column is removed
-- from databases that still have it
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- One account per email, ignoring capital letters
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email));

-- Student profile details (My profile page). Added later, so they are
-- ALTERs that do nothing if the columns already exist.
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_number VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS programme VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_of_study SMALLINT;      -- 1-5, 6 = postgraduate
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_year_of_study_check') THEN
    ALTER TABLE users
      ADD CONSTRAINT users_year_of_study_check CHECK (year_of_study BETWEEN 1 AND 6);
  END IF;
END $$;

-- Accommodations (price is per month, in N$)
CREATE TABLE IF NOT EXISTS accommodations (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150)  NOT NULL,
  location     VARCHAR(255)  NOT NULL,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- What each accommodation offers, used by the Explore filters, e.g. {Kitchen, Gym}
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS facilities TEXT[] NOT NULL DEFAULT '{}';

-- Listing details: street address, house rules and who to contact
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS rules TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS contact_name VARCHAR(150);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Room types an accommodation offers, each with its own monthly price (N$)
-- and whether there is space right now
CREATE TABLE IF NOT EXISTS accommodation_room_types (
  id                SERIAL PRIMARY KEY,
  accommodation_id  INTEGER NOT NULL REFERENCES accommodations (id) ON DELETE CASCADE,
  room_type         VARCHAR(20)    NOT NULL CHECK (room_type IN ('Single', 'Shared', 'Triple')),
  price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  is_available      BOOLEAN        NOT NULL DEFAULT TRUE,
  UNIQUE (accommodation_id, room_type)
);

-- How many rooms of each type are free right now (NULL = not known)
ALTER TABLE accommodation_room_types
  ADD COLUMN IF NOT EXISTS available_rooms INTEGER CHECK (available_rooms >= 0);

-- How far an accommodation is from each campus, in km
CREATE TABLE IF NOT EXISTS accommodation_distances (
  accommodation_id  INTEGER NOT NULL REFERENCES accommodations (id) ON DELETE CASCADE,
  campus            VARCHAR(20)   NOT NULL,          -- e.g. NUST, UNAM
  distance_km       NUMERIC(5, 2) NOT NULL CHECK (distance_km >= 0),
  PRIMARY KEY (accommodation_id, campus)
);

-- Photos of an accommodation (Cloudinary URLs)
CREATE TABLE IF NOT EXISTS accommodation_images (
  id                SERIAL PRIMARY KEY,
  accommodation_id  INTEGER NOT NULL REFERENCES accommodations (id) ON DELETE CASCADE,
  image_url         TEXT    NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accommodation_images_accommodation_idx
  ON accommodation_images (accommodation_id);

-- The old rooms table is no longer used: availability comes from
-- accommodation_room_types
DROP TABLE IF EXISTS rooms;

-- Applications from students
CREATE TABLE IF NOT EXISTS applications (
  id                SERIAL PRIMARY KEY,
  student_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  accommodation_id  INTEGER NOT NULL REFERENCES accommodations (id) ON DELETE CASCADE,
  status            VARCHAR(20) NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  room_type         VARCHAR(20),   -- Single / Shared / Triple, chosen when applying
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when the status last changed
  decision_reason   TEXT,          -- why it was rejected (automatic review)
  lease_start       DATE,          -- set automatically when approved
  lease_end         DATE,
  lease_signed_at   TIMESTAMPTZ    -- when the student signed; NULL = not signed yet
);

-- Lease columns for databases created before they existed (no-op otherwise)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS lease_start DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS lease_end DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS lease_signed_at TIMESTAMPTZ;

-- Automatic review columns for databases created before they existed
ALTER TABLE applications ADD COLUMN IF NOT EXISTS room_type VARCHAR(20);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE applications ADD COLUMN IF NOT EXISTS decision_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_lease_dates_check') THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_lease_dates_check CHECK (lease_end > lease_start);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS applications_student_idx ON applications (student_id);

-- The automatic review looks up applications by status
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status, status_updated_at);

-- Every status change of an application, when, and why.
-- changed_by is the student (e.g. signing the lease), or NULL for the
-- automatic review
CREATE TABLE IF NOT EXISTS application_status_history (
  id              SERIAL PRIMARY KEY,
  application_id  INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL,
  changed_by      INTEGER REFERENCES users (id) ON DELETE SET NULL,
  note            TEXT,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_status_history_application_idx
  ON application_status_history (application_id);

-- Notifications shown to a user (e.g. application status updates)
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  application_id  INTEGER REFERENCES applications (id) ON DELETE CASCADE,
  message         TEXT    NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);
