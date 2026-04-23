const { ipcMain } = require('electron');
const { getDb } = require('../db/database.cjs');

function rowToTemplate(row) {
  return {
    id:            row.id,
    name:          row.name,
    extensions:    row.extensions,
    keywords:      row.keywords,
    targetFolder:  row.target_folder,
    renamePattern: row.rename_pattern,
    autoApply:     row.auto_apply,
    enabled:       row.enabled,
    description:   row.description,
    priority:      row.priority,
  };
}

function registerTemplateHandlers() {
  // 전체 목록 (priority 순)
  ipcMain.handle('settings:getTemplates', () => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM templates ORDER BY priority ASC, id ASC').all();
    return rows.map(rowToTemplate);
  });

  // 추가
  ipcMain.handle('settings:saveTemplate', (_e, t) => {
    const db = getDb();
    const maxRow = db.prepare('SELECT MAX(priority) as m FROM templates').get();
    const nextPriority = (maxRow.m ?? -1) + 1;
    const stmt = db.prepare(`
      INSERT INTO templates (name, extensions, keywords, target_folder, rename_pattern, auto_apply, enabled, description, priority)
      VALUES (@name, @extensions, @keywords, @targetFolder, @renamePattern, @autoApply, @enabled, @description, @priority)
    `);
    const info = stmt.run({
      name:          t.name,
      extensions:    t.extensions    ?? '',
      keywords:      t.keywords      ?? '',
      targetFolder:  t.targetFolder,
      renamePattern: t.renamePattern ?? null,
      autoApply:     t.autoApply     ?? 1,
      enabled:       t.enabled       ?? 1,
      description:   t.description   ?? '',
      priority:      t.priority      != null ? t.priority : nextPriority,
    });
    return { id: info.lastInsertRowid };
  });

  // 수정
  ipcMain.handle('settings:updateTemplate', (_e, t) => {
    const db = getDb();
    db.prepare(`
      UPDATE templates SET
        name          = @name,
        extensions    = @extensions,
        keywords      = @keywords,
        target_folder = @targetFolder,
        rename_pattern = @renamePattern,
        auto_apply    = @autoApply,
        enabled       = @enabled,
        description   = @description,
        priority      = @priority
      WHERE id = @id
    `).run({
      id:            t.id,
      name:          t.name,
      extensions:    t.extensions    ?? '',
      keywords:      t.keywords      ?? '',
      targetFolder:  t.targetFolder,
      renamePattern: t.renamePattern ?? null,
      autoApply:     t.autoApply     ?? 1,
      enabled:       t.enabled       ?? 1,
      description:   t.description   ?? '',
      priority:      t.priority      ?? 0,
    });
    return { ok: true };
  });

  // 삭제
  ipcMain.handle('settings:deleteTemplate', (_e, id) => {
    const db = getDb();
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return { ok: true };
  });

  // 우선순위 일괄 업데이트 (drag & drop 또는 ▲▼ 이동 후 전체 순서 저장)
  ipcMain.handle('settings:reorderTemplates', (_e, orderedIds) => {
    const db = getDb();
    const update = db.prepare('UPDATE templates SET priority = ? WHERE id = ?');
    const run = db.transaction(() => {
      orderedIds.forEach((id, idx) => update.run(idx, id));
    });
    run();
    return { ok: true };
  });
}

module.exports = { registerTemplateHandlers };
