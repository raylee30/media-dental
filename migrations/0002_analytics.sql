CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  page_title TEXT,
  page_type TEXT,
  product_slug TEXT,
  product_title TEXT,
  referrer TEXT,
  source_type TEXT,
  source_label TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  ip TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_new_visitor INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON analytics_events(path);
