const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowdesk', {
  // 스캔
  scanFolder:       (folderPath) => ipcRenderer.invoke('scan:folder', folderPath),
  selectFolder:     ()           => ipcRenderer.invoke('dialog:selectFolder'),

  // 정리 실행
  applyPlan:        (plans)      => ipcRenderer.invoke('move:apply', plans),

  // 리비전 복구
  getRevisions:     ()           => ipcRenderer.invoke('restore:getRevisions'),
  restoreRevision:  (revisionId) => ipcRenderer.invoke('restore:revision', revisionId),
  restoreFiles:     (fileIds)    => ipcRenderer.invoke('restore:files', fileIds),

  // 템플릿 설정
  getTemplates:     ()           => ipcRenderer.invoke('settings:getTemplates'),
  saveTemplate:     (template)   => ipcRenderer.invoke('settings:saveTemplate', template),
  deleteTemplate:   (id)         => ipcRenderer.invoke('settings:deleteTemplate', id),
});