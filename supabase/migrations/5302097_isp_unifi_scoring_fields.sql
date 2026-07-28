ALTER TABLE isp_assessments ADD COLUMN IF NOT EXISTS monthly_cost numeric DEFAULT 0;
ALTER TABLE isp_assessments ADD COLUMN IF NOT EXISTS contract_length_months integer DEFAULT 12;
ALTER TABLE isp_assessments ADD COLUMN IF NOT EXISTS consolidation_score integer DEFAULT 0;
ALTER TABLE isp_assessments ADD COLUMN IF NOT EXISTS recommendation text;

ALTER TABLE unifi_surveys ADD COLUMN IF NOT EXISTS ap_count integer DEFAULT 0;
ALTER TABLE unifi_surveys ADD COLUMN IF NOT EXISTS switch_count integer DEFAULT 0;
ALTER TABLE unifi_surveys ADD COLUMN IF NOT EXISTS estimated_cost numeric DEFAULT 0;