import { useAppStore } from './store/useAppStore';
import Dashboard from './pages/Dashboard';
import FolderView from './pages/FolderView';
import Preview from './pages/Preview';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import Settings from './pages/Settings';
import type {
  ScanResult,
  FolderListResult,
  ApplyResult,
  ApplyInput,
  Revision,
  RestoreItemResult,
  RevisionDetail,
  Template,
  FilePlan,
} from './types';

declare global {
  interface Window {
    flowdesk: {
      listFiles:       (folderPath: string)    => Promise<FolderListResult>;
      selectFolder:    ()                       => Promise<string | null>;
      scanFolder:      (folderPath: string)    => Promise<ScanResult>;
      applyPlan:       (input: ApplyInput)     => Promise<ApplyResult>;
      getRevisions:    ()                      => Promise<Revision[]>;
      restoreRevision: (revisionId: number)    => Promise<RestoreItemResult[]>;
      restoreFiles:    (fileIds: number[])     => Promise<RestoreItemResult[]>;
      // History
      listRevisions:     ()                    => Promise<Revision[]>;
      getRevisionDetail: (id: number)          => Promise<RevisionDetail | null>;
      getRevisionFiles:  (id: number)          => Promise<RevisionDetail['files']>;
      getRevisionLogs:   (id: number)          => Promise<RevisionDetail['logs']>;
      deleteRevision:    (id: number)          => Promise<{ ok: boolean }>;
      // Templates
      getTemplates:      ()                           => Promise<Template[]>;
      saveTemplate:      (t: Omit<Template, 'id'>)    => Promise<{ id: number }>;
      updateTemplate:    (t: Template)                 => Promise<{ ok: boolean }>;
      deleteTemplate:    (id: number)                  => Promise<{ ok: boolean }>;
      reorderTemplates:  (orderedIds: number[])        => Promise<{ ok: boolean }>;
    };
  }
}

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage);

  return (
    <div className="app">
      {currentPage === 'dashboard'      && <Dashboard />}
      {currentPage === 'folder-view'    && <FolderView />}
      {currentPage === 'preview'        && <Preview />}
      {currentPage === 'history'        && <History />}
      {currentPage === 'history-detail' && <HistoryDetail />}
      {currentPage === 'settings'       && <Settings />}
    </div>
  );
}