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

    const applyAll = db.transaction((plans) => {
      const { lastInsertRowid: revisionId } = insertRevision.run(plans.length);

      for (const plan of plans) {
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
      }

      return Number(revisionId);
    });

    try {
      const revisionId = applyAll(plans);
      return { revisionId };
    } catch (error) {
      return { error: error.message };
    }
  });
}

module.exports = { registerMoveHandlers };
