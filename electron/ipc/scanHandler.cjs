const { ipcMain, dialog, BrowserWindow } = require('electron');
const { scanFolder } = require('../core/scanner.cjs');
const { buildPlans } = require('../core/matcher.cjs');
const { getDb } = require('../db/database.cjs');

function registerScanHandlers() {
  ipcMain.handle('scan:folder', async (_event, folderPath) => {
    try {
      const db = getDb();
      const templates = db.prepare('SELECT * FROM templates').all();
      const files = scanFolder(folderPath);
      const plans = buildPlans(files, templates, folderPath);
      return { plans };
    } catch (error) {
      return { plans: [], error: error.message };
    }
  });

  ipcMain.handle('dialog:selectFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: '정리할 폴더 선택',
    });
    return result.canceled ? null : result.filePaths[0];
  });
}

module.exports = { registerScanHandlers };
