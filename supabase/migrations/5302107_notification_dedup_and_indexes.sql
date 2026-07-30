-- Add notification_key for dedup (deterministic, used for upsert on conflict)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_key ON notifications (notification_key) WHERE notification_key IS NOT NULL;

-- Add DB indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments (ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets (organization_id, created_at DESC);
