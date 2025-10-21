-- Supabase Database Schema for Playground Sim
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  simulation_count INTEGER DEFAULT 0
);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_text TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'tech_twitter',
  tweet_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating', -- 'generating' | 'completed' | 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated tweets table
CREATE TABLE IF NOT EXISTS generated_tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL, -- e.g. "@tech_guru"
  tweet_text TEXT NOT NULL,
  sentiment TEXT NOT NULL, -- 'praise' | 'neutral' | 'worry'
  is_reply BOOLEAN DEFAULT FALSE,
  reply_to_id UUID REFERENCES generated_tweets(id),
  order_index INTEGER NOT NULL, -- for sorting
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tweets_simulation_id ON generated_tweets(simulation_id);
CREATE INDEX IF NOT EXISTS idx_tweets_sentiment ON generated_tweets(sentiment);
CREATE INDEX IF NOT EXISTS idx_tweets_order ON generated_tweets(order_index);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_tweets ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Simulations table policies
CREATE POLICY "Users can view their own simulations" ON simulations
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create their own simulations" ON simulations
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own simulations" ON simulations
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Generated tweets table policies
CREATE POLICY "Users can view tweets from their simulations" ON generated_tweets
  FOR SELECT USING (
    simulation_id IN (
      SELECT id FROM simulations WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- Service role can do everything (for API endpoints)
-- Note: These policies are automatically handled when using service_role key

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_simulations_updated_at 
  BEFORE UPDATE ON simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts synced from Clerk authentication';
COMMENT ON TABLE simulations IS 'Simulation runs created by users';
COMMENT ON TABLE generated_tweets IS 'AI-generated tweet responses for each simulation';
COMMENT ON COLUMN simulations.status IS 'Status: generating, completed, or failed';
COMMENT ON COLUMN generated_tweets.sentiment IS 'Sentiment: praise, neutral, or worry';

