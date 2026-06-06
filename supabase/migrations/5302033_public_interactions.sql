CREATE TABLE IF NOT EXISTS public.public_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45),
  location VARCHAR(150),
  user_agent TEXT,
  platform VARCHAR(100),
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20) DEFAULT 'started',
  company_name VARCHAR(150),
  client_name VARCHAR(100),
  client_email VARCHAR(100),
  client_phone VARCHAR(50),
  services_requested TEXT,
  employees VARCHAR(50),
  urgency VARCHAR(50),
  client_message TEXT,
  submitted_at TIMESTAMPTZ
);

ALTER TABLE public.public_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_interactions_insert" ON public.public_interactions
  FOR INSERT TO anon WITH CHECK (true);
