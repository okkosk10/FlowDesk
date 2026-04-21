const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database.cjs');
const { getFingerprint } = require('../core/scanner.cjs');

/** 현재 파일 상태 점검 */
function checkFileStatus(record) {
  if (!fs.existsSync(record.target_path)) return 'deleted';
  const fp = getFingerprint(record.target_path);
  if (fp !== record.fingerprint) return 'modified';
  return 'ok';
}

function registerRestoreHandlers() {
  // ── 리비전 목록 조회 ──────────────────────────────────────────────
  ipcMain.handle('restore:getRevisions', async () => {
    const db = getDb();
    return db
      .prepare(
        `SELECT id,
                created_at  AS createdAt,
                file_count  AS fileCount,
                label
           FROM revisions
          ORDER BY id DESC`
      )
      .all();
  });

  // ── 리비전 전체 복구 ──────────────────────────────────────────────
  ipcMain.handle('restore:revision', async (_event, revisionId) => {
    const db = getDb();
    const records = db
      .prepare(
        `SELECT * FROM file_records
          WHERE revision_id = ? AND status = 'moved'`
      )
      .all(revisionId);

    const results = [];

    for (const record of records) {
      const state = checkFileStatus(record);

      if (state === 'deleted') {
        results.push({ id: record.id, status: 'deleted', path: record.target_path });
        continue;
      }
      if (state === 'modified') {
        results.push({ id: record.id, status: 'modified', path: record.target_path });
        continue;
      }
      if (fs.existsSync(record.original_path)) {
        results.push({ id: record.id, status: 'conflict', path: record.original_path });
        continue;
      }

      const originalDir = path.dirname(record.original_path);
      if (!fs.existsSync(originalDir)) {
        fs.mkdirSync(originalDir, { recursive: true });
      }
      fs.renameSync(record.target_path, record.original_path);
      db.prepare("UPDATE file_records SET status = 'restored' WHERE id = ?").run(record.id);
      results.push({ id: record.id, status: 'restored' });
    }

    return results;
  });

  // ── 개별 파일 복구 ────────────────────────────────────────────────
  ipcMain.handle('restore:files', async (_event, fileIds) => {
    const db = getDb();
    const results = [];

    for (const fileId of fileIds) {
      const record = db.prepare('SELECT * FROM file_records WHERE id = ?').get(fileId);
      if (!record) continue;

      const state = checkFileStatus(record);
      if (state !== 'ok') {
        results.push({ id: fileId, status: state });
        continue;
      }
      if (fs.existsSync(record.original_path)) {
        results.push({ id: fileId, status: 'conflict' });
        continue;
      }

      const originalDir = path.dirname(record.original_path);
      if (!fs.existsSync(originalDir)) {
        fs.mkdirSync(originalDir, { recursive: true });
      }
      fs.renameSync(record.target_path, record.original_path);
      db.prepare("UPDATE file_records SET status = 'restored' WHERE id = ?").run(fileId);
      results.push({ id: fileId, status: 'restored' });
    }

    return results;
  });

  // ── 템플릿 CRUD ───────────────────────────────────────────────────
  ipcMain.handle('settings:getTemplates', async () => {
    return getDb().prepare('SELECT * FROM templates ORDER BY id').all();
  });

  ipcMain.handle('settings:saveTemplate', async (_event, t) => {
    getDb()
      .prepare(
        `INSERT INTO templates
           (name, extensions, keywords, target_folder, rename_pattern, auto_apply)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(t.name, t.extensions, t.keywords, t.targetFolder, t.renamePattern ?? null, t.autoApply);
  });

  ipcMain.handle('settings:deleteTemplate', async (_event, id) => {
    getDb().prepare('DELETE FROM templates WHERE id = ?').run(id);
  });
}

module.exports = { registerRestoreHandlers };
