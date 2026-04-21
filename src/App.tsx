import { useAppStore } from './store/useAppStore';
import Dashboard from './pages/Dashboard';
import Preview from './pages/Preview';
import History from './pages/History';
import Settings from './pages/Settings';
import type {
  ScanResult,
  ApplyResult,
  Revision,
  RestoreItemResult,
  Template,
  FilePlan,
} from './types';

declare global {
  interface Window {
    flowdesk: {
      scanFolder:      (folderPath: string) => Promise<ScanResult>;
      selectFolder:    ()                   => Promise<string | null>;
      applyPlan:       (plans: FilePlan[])  => Promise<ApplyResult>;
      getRevisions:    ()                   => Promise<Revision[]>;
      restoreRevision: (revisionId: number) => Promise<RestoreItemResult[]>;
      restoreFiles:    (fileIds: number[])  => Promise<RestoreItemResult[]>;
      getTemplates:    ()                   => Promise<Template[]>;
      saveTemplate:    (t: Omit<Template, 'id'>) => Promise<void>;
      deleteTemplate:  (id: number)         => Promise<void>;
    };
  }
}

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage);

  return (
    <div className="app">
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'preview'   && <Preview />}
      {currentPage === 'history'   && <History />}
      {currentPage === 'settings'  && <Settings />}
    </div>
  );
}