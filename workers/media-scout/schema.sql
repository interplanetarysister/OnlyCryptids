-- OnlyCryptids Media Scout. Separate public media metadata from paid/member posts.
CREATE TABLE IF NOT EXISTS scout_control (
 id INTEGER PRIMARY KEY CHECK (id=1),
 enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
 term_index INTEGER NOT NULL DEFAULT 0,
 search_offset INTEGER NOT NULL DEFAULT 0,
 last_run TEXT,
 last_added INTEGER NOT NULL DEFAULT 0,
 last_error TEXT
);
INSERT OR IGNORE INTO scout_control(id,enabled) VALUES (1,1);
CREATE TABLE IF NOT EXISTS sourced_media (
 id TEXT PRIMARY KEY,
 source_url TEXT NOT NULL UNIQUE,
 media_url TEXT NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('image','video')),
 topic TEXT NOT NULL,
 tags_json TEXT NOT NULL,
 title TEXT NOT NULL,
 caption TEXT NOT NULL,
 alt_text TEXT NOT NULL,
 author_credit TEXT NOT NULL,
 license_name TEXT NOT NULL,
 license_url TEXT,
 published_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sourced_media_topic ON sourced_media(topic,published_at);
CREATE INDEX IF NOT EXISTS idx_sourced_media_date ON sourced_media(published_at);
