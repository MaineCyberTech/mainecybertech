ALTER TABLE knowledge_articles ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0;
ALTER TABLE knowledge_articles ADD COLUMN IF NOT EXISTS not_helpful_count integer DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_article_count(article_id uuid, field_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE knowledge_articles SET %I = %I + 1 WHERE id = $1', field_name, field_name) USING article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;