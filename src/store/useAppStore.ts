import { create } from 'zustand';
import type { FilePlan, FileEntry, Revision, Page } from '../types';

interface AppStore {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  scanPath: string;
  setScanPath: (path: string) => void;

  fileEntries: FileEntry[];
  setFileEntries: (entries: FileEntry[]) => void;

  filePlans: FilePlan[];
  setFilePlans: (plans: FilePlan[]) => void;

  // 스캔 통계 (applyPlan에 전달)
  totalScanned: number;
  setTotalScanned: (n: number) => void;
  unmatchedCount: number;
  setUnmatchedCount: (n: number) => void;

  revisions: Revision[];
  setRevisions: (revisions: Revision[]) => void;

  // History 상세 페이지
  selectedRevisionId: number | null;
  setSelectedRevisionId: (id: number | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  scanPath: '',
  setScanPath: (path) => set({ scanPath: path }),

  fileEntries: [],
  setFileEntries: (entries) => set({ fileEntries: entries }),

  filePlans: [],
  setFilePlans: (plans) => set({ filePlans: plans }),

  totalScanned: 0,
  setTotalScanned: (n) => set({ totalScanned: n }),
  unmatchedCount: 0,
  setUnmatchedCount: (n) => set({ unmatchedCount: n }),

  revisions: [],
  setRevisions: (revisions) => set({ revisions }),

  selectedRevisionId: null,
  setSelectedRevisionId: (id) => set({ selectedRevisionId: id }),
}));

