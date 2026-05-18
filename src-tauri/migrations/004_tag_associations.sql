CREATE TABLE IF NOT EXISTS tag_associations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('character', 'note', 'timeline_event', 'dogma', 'faction', 'dynasty')),
  entity_id INTEGER NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(tag_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_associations_entity
  ON tag_associations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tag_associations_tag
  ON tag_associations(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_associations_full
  ON tag_associations(entity_type, entity_id, tag_id);
