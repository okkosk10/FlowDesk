const { ipcMain } = require('electron');
const { getDb } = require('../db/database.cjs');

// ─── 공통 SELECT ──────────────────────────────────────────────────
const REVISION_COLS = `
  SELECT id,
         base_path       AS basePath,
         created_at      AS createdAt,
         note,
         file_count      AS fileCount,
         total_scanned   AS totalScanned,
         planned_count   AS plannedCount,
         success_count   AS successCount,
         fail_count      AS failCount,
         skipped_count   AS skippedCount,
         conflict_count  AS conflictCount,
         unmatched_count AS unmatchedCount
    FROM revisions
`;

const FILE_MOVES_COLS = `
  SELECT id,
         revision_id   AS revisionId,
         original_path AS originalPath,
         target_path   AS targetPath,
         final_name    AS finalName,
         template_id   AS templateId,
         template_name AS templateName,
         status, reason, fingerprint,
         created_at    AS createdAt
    FROM file_moves
   WHERE revision_id = ?
   ORDER BY id ASC
`;

const REVISION_LOGS_COLS = `
  SELECT id,
         revision_id AS revisionId,
         log_type    AS logType,
         message,
         created_at  AS createdAt,
         meta_json   AS metaJson
    FROM revision_logs
   WHERE revision_id = ?
   ORDER BY id ASC
`;

function registerHistoryHandlers() {
  // ── 목록 (최신순)
  ipcMain.handle('history:list', () => {
    return getDb()
      .prepare(REVISION_COLS + 'ORDER BY id DESC')
      .all();
  });

  // ── 상세 (revision + files + logs 한 번에)
  ipcMain.handle('history:detail', (_e, revisionId) => {
    const db = getDb();
    const revision = db.prepare(REVISION_COLS + 'WHERE id = ?').get(revisionId);
    if (!revision) return null;

    const files = db.prepare(FILE_MOVES_COLS).all(revisionId);
    const logs  = db.prepare(REVISION_LOGS_COLS).all(revisionId);

    return { revision, files, logs };
  });

  // ── 파일 목록만
  ipcMain.handle('history:files', (_e, revisionId) => {
    return getDb().prepare(FILE_MOVES_COLS).all(revisionId);
  });

  // ── 로그만
  ipcMain.handle('history:logs', (_e, revisionId) => {
    return getDb().prepare(REVISION_LOGS_COLS).all(revisionId);
  });

  // ── 리비전 삭제 (연관 데이터 포함)
  ipcMain.handle('history:delete', (_e, revisionId) => {
    const db = getDb();
    db.transaction(() => {
      db.prepare('DELETE FROM file_moves    WHERE revision_id = ?').run(revisionId);
      db.prepare('DELETE FROM revision_logs WHERE revision_id = ?').run(revisionId);
      db.prepare('DELETE FROM file_records  WHERE revision_id = ?').run(revisionId);
      db.prepare('DELETE FROM revisions     WHERE id = ?').run(revisionId);
    })();
    return { ok: true };
  });
}

module.exports = { registerHistoryHandlers };
