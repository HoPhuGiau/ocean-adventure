-- Create leaderboard table for storing player scores
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  points INTEGER DEFAULT 0 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  visited_dapps INTEGER DEFAULT 0 NOT NULL,
  completed_quests INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_wallet_address ON leaderboard(wallet_address);

-- Create index on points and xp for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(points DESC, xp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leaderboard_updated_at 
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read leaderboard (for public leaderboard)
CREATE POLICY "Allow public read access to leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert/update their own score
CREATE POLICY "Allow insert/update own score"
  ON leaderboard FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create view for top players
CREATE OR REPLACE VIEW top_players AS
SELECT 
  wallet_address,
  points,
  xp,
  level,
  visited_dapps,
  completed_quests,
  ROW_NUMBER() OVER (ORDER BY points DESC, xp DESC) as rank
FROM leaderboard
ORDER BY points DESC, xp DESC
LIMIT 100;

