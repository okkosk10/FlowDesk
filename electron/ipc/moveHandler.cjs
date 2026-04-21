const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database.cjs');
const { getFingerprint } = require('../core/scanner.cjs');

function registerMoveHandlers() {
  ipcMain.handle('move:apply', async (_event, plans) => {
    const db = getDb();

    const insertRevision = db.prepare(
      'INSERT INTO revisions (file_count) VALUES (?)'
    );
    const insertRecord = db.prepare(
      `INSERT INTO file_records
         (revision_id, original_path, target_path, original_name, target_name, applied_rule, fingerprint, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'moved')`
    );

    try {
      const { lastInsertRowid: revisionId } = insertRevision.run(plans.length);
      const failed = [];
      let successCount = 0;

      for (const plan of plans) {
        try {
          if (!fs.existsSync(plan.targetFolder)) {
            fs.mkdirSync(plan.targetFolder, { recursive: true });
          }

          const targetPath = path.join(plan.targetFolder, plan.targetName);
          const fingerprint = getFingerprint(plan.originalPath);
          fs.renameSync(plan.originalPath, targetPath);

          insertRecord.run(
            revisionId,
            plan.originalPath,
            targetPath,
            plan.originalName,
            plan.targetName,
            plan.appliedRule,
            fingerprint
          );
          successCount++;
        } catch (fileError) {
          const code = fileError.code ?? '';
          const reason =
            code === 'EBUSY'   ? '파일이 다른 프로그램에서 열려 있습니다.' :
            code === 'EACCES'  ? '파일 접근 권한이 없습니다.' :
            code === 'ENOENT'  ? '파일을 찾을 수 없습니다.' :
                                 fileError.message;
          failed.push({ name: plan.originalName, reason });
        }
      }

      // 성공한 파일 수로 revision 업데이트
      db.prepare('UPDATE revisions SET file_count = ? WHERE id = ?').run(successCount, revisionId);

      return { revisionId: Number(revisionId), successCount, failed };
    } catch (error) {
      return { error: error.message };
    }
  });
}

module.exports = { registerMoveHandlers };
