CREATE TABLE store_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  badge_text TEXT DEFAULT '',
  detail_text TEXT DEFAULT '',
  promo_type TEXT NOT NULL DEFAULT 'bundle_savings',
  status TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'expired', 'archived')),
  terms TEXT DEFAULT '',
  eligibility_targets TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE store_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions" ON store_promotions
  FOR SELECT USING (status = 'active');

CREATE POLICY "Service role full access" ON store_promotions
  FOR ALL USING (true);
