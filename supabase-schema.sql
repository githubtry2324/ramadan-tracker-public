-- Ramadan Quran Tracker - Multi-tenant Schema
-- Run this in your Supabase SQL Editor

-- Families table (for multi-tenant support)
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- Juz completions table
CREATE TABLE juz_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  juz_number INTEGER NOT NULL CHECK (juz_number >= 1 AND juz_number <= 30),
  round INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, juz_number, round)
);

-- Admin users table (for admin dashboard access)
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_participants_family ON participants(family_id);
CREATE INDEX idx_completions_participant ON juz_completions(participant_id);

-- Row Level Security (optional but recommended)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE juz_completions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (honor system like original)
CREATE POLICY "Allow all on families" ON families FOR ALL USING (true);
CREATE POLICY "Allow all on participants" ON participants FOR ALL USING (true);
CREATE POLICY "Allow all on juz_completions" ON juz_completions FOR ALL USING (true);
