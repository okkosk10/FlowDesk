const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { SCHEMA, MIGRATIONS } = require('./schema.cjs');

let db = null;

function runMigrations(database) {
  for (const sql of MIGRATIONS) {
    try {
      database.exec(sql);
    } catch (e) {
      // 이미 컬럼이 존재하면 무시
      if (!e.message.includes('duplicate column name')) throw e;
    }
  }
}

function getDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'flowdesk.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  runMigrations(db);
  return db;
}

module.exports = { getDb };
