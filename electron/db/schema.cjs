const SCHEMA = `
  CREATE TABLE IF NOT EXISTS revisions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    file_count      INTEGER NOT NULL DEFAULT 0,
    label           TEXT,
    base_path       TEXT    NOT NULL DEFAULT '',
    note            TEXT,
    total_scanned   INTEGER NOT NULL DEFAULT 0,
    planned_count   INTEGER NOT NULL DEFAULT 0,
    success_count   INTEGER NOT NULL DEFAULT 0,
    fail_count      INTEGER NOT NULL DEFAULT 0,
    skipped_count   INTEGER NOT NULL DEFAULT 0,
    conflict_count  INTEGER NOT NULL DEFAULT 0,
    unmatched_count INTEGER NOT NULL DEFAULT 0,
    options_json    TEXT
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

  CREATE TABLE IF NOT EXISTS file_moves (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    revision_id   INTEGER NOT NULL,
    original_path TEXT    NOT NULL,
    target_path   TEXT,
    final_name    TEXT,
    template_id   INTEGER,
    template_name TEXT,
    status        TEXT    NOT NULL DEFAULT 'moved',
    reason        TEXT,
    fingerprint   TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (revision_id) REFERENCES revisions(id)
  );

  CREATE TABLE IF NOT EXISTS revision_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    revision_id INTEGER NOT NULL,
    log_type    TEXT    NOT NULL DEFAULT 'info',
    message     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    meta_json   TEXT,
    FOREIGN KEY (revision_id) REFERENCES revisions(id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    extensions     TEXT    NOT NULL DEFAULT '',
    keywords       TEXT    NOT NULL DEFAULT '',
    target_folder  TEXT    NOT NULL,
    rename_pattern TEXT,
    auto_apply     INTEGER NOT NULL DEFAULT 1,
    enabled        INTEGER NOT NULL DEFAULT 1,
    description    TEXT    NOT NULL DEFAULT '',
    priority       INTEGER NOT NULL DEFAULT 0
  );
`;

const MIGRATIONS = [
  // templates 컬럼
  `ALTER TABLE templates ADD COLUMN enabled     INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE templates ADD COLUMN description TEXT    NOT NULL DEFAULT ''`,
  `ALTER TABLE templates ADD COLUMN priority    INTEGER NOT NULL DEFAULT 0`,
  // revisions 컬럼 (기존 DB 업그레이드)
  `ALTER TABLE revisions ADD COLUMN base_path       TEXT    NOT NULL DEFAULT ''`,
  `ALTER TABLE revisions ADD COLUMN note            TEXT`,
  `ALTER TABLE revisions ADD COLUMN total_scanned   INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN planned_count   INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN success_count   INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN fail_count      INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN skipped_count   INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN conflict_count  INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN unmatched_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE revisions ADD COLUMN options_json    TEXT`,
];

module.exports = { SCHEMA, MIGRATIONS };

