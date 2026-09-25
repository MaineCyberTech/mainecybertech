CREATE TABLE store_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'converted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE store_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quotes" ON store_quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON store_quotes
  FOR ALL USING (true) WITH CHECK (true);
