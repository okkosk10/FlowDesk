const fs   = require('fs');
const path = require('path');
const { getFingerprint } = require('../core/scanner.cjs');

// ─── 로그 삽입 헬퍼 ────────────────────────────────────────────────
/**
 * @param {import('better-sqlite3').Database} db
 * @param {number} revisionId
 * @param {'info'|'warn'|'error'|'debug'} logType
 * @param {string} message
 * @param {object} [meta]
 */
function insertLog(db, revisionId, logType, message, meta) {
  db.prepare(`
    INSERT INTO revision_logs (revision_id, log_type, message, meta_json, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(revisionId, logType, message, meta ? JSON.stringify(meta) : null);
}

// ─── 파일 정리 실행 ────────────────────────────────────────────────
/**
 * @param {import('better-sqlite3').Database} db
 * @param {object} opts
 * @param {string}  opts.basePath        - 정리 대상 폴더 경로
 * @param {Array}   opts.plans           - FilePlan[]
 * @param {number}  [opts.totalScanned]  - 스캔된 전체 파일 수
 * @param {number}  [opts.unmatchedCount]- 미매칭 파일 수
 * @param {string}  [opts.note]          - 메모
 */
function executeOrganize(db, { basePath, plans, totalScanned = 0, unmatchedCount = 0, note }) {
  // 1. Revision 생성
  const revRow = db.prepare(`
    INSERT INTO revisions
      (base_path, note, total_scanned, planned_count, unmatched_count, file_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(basePath, note ?? null, totalScanned, plans.length, unmatchedCount, plans.length);

  const revisionId = Number(revRow.lastInsertRowid);

  // 2. 시작 로그
  insertLog(db, revisionId, 'info', `정리 시작 — 폴더: ${basePath}`);
  insertLog(db, revisionId, 'info',
    `스캔 결과: 전체 ${totalScanned}개 중 ${plans.length}개 매칭, 미매칭 ${unmatchedCount}개`);

  // 3. 파일 이동
  const insertFileMove = db.prepare(`
    INSERT INTO file_moves
      (revision_id, original_path, target_path, final_name,
       template_name, status, reason, fingerprint)
    VALUES
      (@revisionId, @originalPath, @targetPath, @finalName,
       @templateName, @status, @reason, @fingerprint)
  `);

  let successCount = 0;
  let failCount    = 0;
  const failed     = [];

  for (const plan of plans) {
    try {
      if (!fs.existsSync(plan.targetFolder)) {
        fs.mkdirSync(plan.targetFolder, { recursive: true });
      }

      const targetPath  = path.join(plan.targetFolder, plan.targetName);
      const fingerprint = getFingerprint(plan.originalPath);
      fs.renameSync(plan.originalPath, targetPath);

      insertFileMove.run({
        revisionId,
        originalPath:  plan.originalPath,
        targetPath,
        finalName:     plan.targetName,
        templateName:  plan.appliedRule,
        status:        'moved',
        reason:        plan.reason,
        fingerprint,
      });

      successCount++;
    } catch (err) {
      const code   = err.code ?? '';
      const reason =
        code === 'EBUSY'  ? '파일이 다른 프로그램에서 열려 있습니다.' :
        code === 'EACCES' ? '파일 접근 권한이 없습니다.' :
        code === 'ENOENT' ? '파일을 찾을 수 없습니다.' :
                            err.message;

      insertFileMove.run({
        revisionId,
        originalPath:  plan.originalPath,
        targetPath:    null,
        finalName:     null,
        templateName:  plan.appliedRule,
        status:        'failed',
        reason,
        fingerprint:   null,
      });

      failCount++;
      failed.push({ name: plan.originalName, reason });
      insertLog(db, revisionId, 'error',
        `실패: ${plan.originalName}`, { reason, code: code || undefined });
    }
  }

  // 4. Revision 통계 업데이트
  db.prepare(`
    UPDATE revisions
       SET success_count = ?,
           fail_count    = ?,
           file_count    = ?
     WHERE id = ?
  `).run(successCount, failCount, successCount, revisionId);

  // 5. 완료 로그
  insertLog(db, revisionId, 'info',
    `정리 완료 — 성공 ${successCount}개, 실패 ${failCount}개`);

  return { revisionId, successCount, failed };
}

module.exports = { executeOrganize, insertLog };
