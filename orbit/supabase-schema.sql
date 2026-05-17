-- ============================================================
-- ORBIT — Supabase Schema
-- Run this in Supabase SQL Editor (project: new or existing)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Orbits ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orbits (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT DEFAULT '',
  color             TEXT DEFAULT '#b5813a',
  icon              TEXT DEFAULT 'orbit-rings',
  priority          INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  weekly_hours_goal NUMERIC(4,1) DEFAULT 4,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orbits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their orbits" ON orbits;
CREATE POLICY "Users own their orbits" ON orbits
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Topics ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orbit_id        UUID REFERENCES orbits(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  subtitle        TEXT DEFAULT '',
  weight          INTEGER DEFAULT 10 CHECK (weight BETWEEN 1 AND 30),
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  estimated_hours NUMERIC(5,1) DEFAULT 2,
  subtopics       JSONB DEFAULT '[]',
  order_idx       INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their topics via orbits" ON topics;
CREATE POLICY "Users own their topics via orbits" ON topics
  USING (
    EXISTS (
      SELECT 1 FROM orbits
      WHERE orbits.id = topics.orbit_id
        AND orbits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orbits
      WHERE orbits.id = topics.orbit_id
        AND orbits.user_id = auth.uid()
    )
  );

-- ── Sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orbit_id         UUID REFERENCES orbits(id) ON DELETE CASCADE,
  topic_id         UUID REFERENCES topics(id) ON DELETE SET NULL,
  duration_sec     INTEGER NOT NULL DEFAULT 0,
  difficulty_after TEXT DEFAULT 'medium' CHECK (difficulty_after IN ('easy', 'medium', 'hard', 'forgot')),
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their sessions via orbits" ON sessions;
CREATE POLICY "Users own their sessions via orbits" ON sessions
  USING (
    EXISTS (
      SELECT 1 FROM orbits
      WHERE orbits.id = sessions.orbit_id
        AND orbits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orbits
      WHERE orbits.id = sessions.orbit_id
        AND orbits.user_id = auth.uid()
    )
  );

-- ── Reviews (spaced repetition) ───────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id       UUID REFERENCES topics(id) ON DELETE CASCADE,
  orbit_id       UUID REFERENCES orbits(id) ON DELETE CASCADE,
  due_at         TIMESTAMPTZ NOT NULL,
  interval_days  INTEGER DEFAULT 1,
  ease           NUMERIC(4,2) DEFAULT 2.5,
  reps           INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their reviews via orbits" ON reviews;
CREATE POLICY "Users own their reviews via orbits" ON reviews
  USING (
    EXISTS (
      SELECT 1 FROM orbits
      WHERE orbits.id = reviews.orbit_id
        AND orbits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orbits
      WHERE orbits.id = reviews.orbit_id
        AND orbits.user_id = auth.uid()
    )
  );

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orbits_user ON orbits(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_orbit ON topics(orbit_id);
CREATE INDEX IF NOT EXISTS idx_sessions_orbit ON sessions(orbit_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_due ON reviews(due_at);
CREATE INDEX IF NOT EXISTS idx_reviews_orbit ON reviews(orbit_id);

-- ── Updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orbits_updated_at ON orbits;
CREATE TRIGGER trg_orbits_updated_at
  BEFORE UPDATE ON orbits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DONE — run in SQL Editor, then set env vars in .env.local
-- ============================================================
