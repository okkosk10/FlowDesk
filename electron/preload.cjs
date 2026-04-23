const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowdesk', {
  // 폴더 탐색
  listFiles:        (folderPath) => ipcRenderer.invoke('folder:list', folderPath),
  selectFolder:     ()           => ipcRenderer.invoke('dialog:selectFolder'),

  // 스캔 (템플릿 매칭)
  scanFolder:       (folderPath) => ipcRenderer.invoke('scan:folder', folderPath),

  // 정리 실행 (input: { basePath, plans, totalScanned?, unmatchedCount?, note? })
  applyPlan:        (input)      => ipcRenderer.invoke('move:apply', input),

  // 리비전 복구
  getRevisions:     ()           => ipcRenderer.invoke('restore:getRevisions'),
  restoreRevision:  (revisionId) => ipcRenderer.invoke('restore:revision', revisionId),
  restoreFiles:     (fileIds)    => ipcRenderer.invoke('restore:files', fileIds),

  // History 조회
  listRevisions:      ()           => ipcRenderer.invoke('history:list'),
  getRevisionDetail:  (id)         => ipcRenderer.invoke('history:detail', id),
  getRevisionFiles:   (id)         => ipcRenderer.invoke('history:files', id),
  getRevisionLogs:    (id)         => ipcRenderer.invoke('history:logs', id),
  deleteRevision:     (id)         => ipcRenderer.invoke('history:delete', id),

  // 템플릿 설정
  getTemplates:      ()              => ipcRenderer.invoke('settings:getTemplates'),
  saveTemplate:      (template)      => ipcRenderer.invoke('settings:saveTemplate', template),
  updateTemplate:    (template)      => ipcRenderer.invoke('settings:updateTemplate', template),
  deleteTemplate:    (id)            => ipcRenderer.invoke('settings:deleteTemplate', id),
  reorderTemplates:  (orderedIds)    => ipcRenderer.invoke('settings:reorderTemplates', orderedIds),
});