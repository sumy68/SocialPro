CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  caption TEXT NOT NULL,
  media_urls TEXT,
  media_type TEXT,
  content_type TEXT,
  scheduled_date TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  access_token TEXT NOT NULL,
  platform_user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_status ON scheduled_posts(status);
