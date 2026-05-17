-- Finance Flow: user data sync table
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  transactions      JSONB NOT NULL DEFAULT '[]',
  goals             JSONB NOT NULL DEFAULT '[]',
  settings          JSONB,
  recurring_transactions JSONB NOT NULL DEFAULT '[]',
  budgets           JSONB NOT NULL DEFAULT '[]',
  has_onboarded     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security: each user can only read/write their own row
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON user_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Automatically update updated_at on every write
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
