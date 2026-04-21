const SCHEMA = `
  CREATE TABLE IF NOT EXISTS revisions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    file_count INTEGER NOT NULL DEFAULT 0,
    label      TEXT
  );

  CREATE TABLE IF NOT EXISTS file_records (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    revision_id   INTEGER NOT NULL,
    original_path TEXT    NOT NULL,
    target_path   TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    target_name   TEXT    NOT NULL,
    applied_rule  TEXT    NOT NULL,
    fingerprint   TEXT,
    status        TEXT    NOT NULL DEFAULT 'moved',
    FOREIGN KEY (revision_id) REFERENCES revisions(id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    extensions     TEXT    NOT NULL DEFAULT '',
    keywords       TEXT    NOT NULL DEFAULT '',
    target_folder  TEXT    NOT NULL,
    rename_pattern TEXT,
    auto_apply     INTEGER NOT NULL DEFAULT 1
  );
`;

module.exports = { SCHEMA };
