const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { SCHEMA } = require('./schema.cjs');

let db = null;

function getDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'flowdesk.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

module.exports = { getDb };
