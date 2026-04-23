const { ipcMain } = require('electron');
const { getDb } = require('../db/database.cjs');
const { executeOrganize } = require('../services/organizeService.cjs');

function registerMoveHandlers() {
  // input: ApplyInput { basePath, plans, totalScanned?, unmatchedCount?, note? }
  //        또는 레거시 plans[]
  ipcMain.handle('move:apply', async (_event, input) => {
    const db = getDb();
    try {
      const opts = Array.isArray(input)
        ? { basePath: '', plans: input, totalScanned: input.length, unmatchedCount: 0 }
        : input;
      return await executeOrganize(db, opts);
    } catch (error) {
      return { error: error.message };
    }
  });
}

module.exports = { registerMoveHandlers };
