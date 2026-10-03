-- PRIV-P1-003: public_interactions stores raw PII (contact form submissions:
-- name, email, phone, message) with RLS disabled (see 5302038) so anonymous
-- visitors can submit leads. Data must not be stored forever — the worker task
-- "public-interaction-retention" purges rows older than 90 days on a daily schedule.

-- Index to make the age-based purge efficient (also serves any age-based reporting).
CREATE INDEX IF NOT EXISTS idx_public_interactions_created_at
  ON public.public_interactions (created_at);

-- Document the retention policy at the schema level.
COMMENT ON TABLE public.public_interactions IS
  'Public contact form submissions (contains PII: name, email, phone, message). '
  'Retention policy: rows are purged after 90 days by the worker task '
  '"public-interaction-retention", scheduled to run daily.';
