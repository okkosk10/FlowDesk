const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database.cjs');
const { getFingerprint } = require('../core/scanner.cjs');
const { insertLog } = require('../services/organizeService.cjs');

function checkFileStatus(targetPath, fingerprint) {
  if (!fs.existsSync(targetPath)) return 'deleted';
  if (getFingerprint(targetPath) !== fingerprint) return 'modified';
  return 'ok';
}

function registerRestoreHandlers() {
  // ── 리비전 목록 (새 필드 포함)
  ipcMain.handle('restore:getRevisions', async () => {
    const db = getDb();
    return db.prepare(`
      SELECT id,
             created_at      AS createdAt,
             file_count      AS fileCount,
             label,
             base_path       AS basePath,
             note,
             total_scanned   AS totalScanned,
             planned_count   AS plannedCount,
             success_count   AS successCount,
             fail_count      AS failCount,
             unmatched_count AS unmatchedCount
        FROM revisions
       ORDER BY id DESC
    `).all();
  });

  // ── 리비전 전체 복구
  ipcMain.handle('restore:revision', async (_event, revisionId) => {
    const db = getDb();

    // 새 구조(file_moves) 우선, 없으면 레거시(file_records) 폴백
    const hasFileMoves = db.prepare(
      'SELECT COUNT(*) AS c FROM file_moves WHERE revision_id = ?'
    ).get(revisionId).c > 0;

    const records = hasFileMoves
      ? db.prepare("SELECT * FROM file_moves   WHERE revision_id = ? AND status = 'moved'").all(revisionId)
      : db.prepare("SELECT * FROM file_records WHERE revision_id = ? AND status = 'moved'").all(revisionId);

    const results = [];

    for (const record of records) {
      const targetPath = record.target_path;
      const state      = checkFileStatus(targetPath, record.fingerprint);

      if (state === 'deleted') {
        results.push({ id: record.id, status: 'deleted',  path: targetPath });
        continue;
      }
      if (state === 'modified') {
        results.push({ id: record.id, status: 'modified', path: targetPath });
        continue;
      }
      if (fs.existsSync(record.original_path)) {
        results.push({ id: record.id, status: 'conflict', path: record.original_path });
        continue;
      }

      const originalDir = path.dirname(record.original_path);
      if (!fs.existsSync(originalDir)) fs.mkdirSync(originalDir, { recursive: true });
      fs.renameSync(targetPath, record.original_path);

      if (hasFileMoves) {
        db.prepare("UPDATE file_moves    SET status = 'restored' WHERE id = ?").run(record.id);
        insertLog(db, revisionId, 'info',
          `복구: ${path.basename(record.original_path)}`);
      } else {
        db.prepare("UPDATE file_records SET status = 'restored' WHERE id = ?").run(record.id);
      }

      results.push({ id: record.id, status: 'restored' });
    }

    return results;
  });

  // ── 개별 파일 복구
  ipcMain.handle('restore:files', async (_event, fileIds) => {
    const db = getDb();
    const results = [];

    for (const fileId of fileIds) {
      // 새 구조 우선, 없으면 레거시
      let record = db.prepare('SELECT * FROM file_moves   WHERE id = ?').get(fileId);
      const isFileMoves = !!record;
      if (!record) record = db.prepare('SELECT * FROM file_records WHERE id = ?').get(fileId);
      if (!record) continue;

      const targetPath = record.target_path;
      const state      = checkFileStatus(targetPath, record.fingerprint);

      if (state !== 'ok') {
        results.push({ id: fileId, status: state });
        continue;
      }
      if (fs.existsSync(record.original_path)) {
        results.push({ id: fileId, status: 'conflict' });
        continue;
      }

      const originalDir = path.dirname(record.original_path);
      if (!fs.existsSync(originalDir)) fs.mkdirSync(originalDir, { recursive: true });
      fs.renameSync(targetPath, record.original_path);

      if (isFileMoves) {
        db.prepare("UPDATE file_moves    SET status = 'restored' WHERE id = ?").run(fileId);
      } else {
        db.prepare("UPDATE file_records SET status = 'restored' WHERE id = ?").run(fileId);
      }

      results.push({ id: fileId, status: 'restored' });
    }

    return results;
  });
}

module.exports = { registerRestoreHandlers };

