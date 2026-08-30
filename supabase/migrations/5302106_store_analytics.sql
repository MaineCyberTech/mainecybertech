CREATE TABLE IF NOT EXISTS store_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  page TEXT,
  product_id TEXT,
  category_id TEXT,
  promo_id TEXT,
  quiz_id TEXT,
  quote_id TEXT,
  campaign_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  anonymous_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow insert from service_role and anon (public tracking)
CREATE POLICY "service_role_all" ON store_analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert" ON store_analytics_events
  FOR INSERT TO anon WITH CHECK (true);
