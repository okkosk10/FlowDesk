import { create } from 'zustand';
import type { FilePlan, Revision, Page } from '../types';

interface AppStore {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  scanPath: string;
  setScanPath: (path: string) => void;

  filePlans: FilePlan[];
  setFilePlans: (plans: FilePlan[]) => void;

  revisions: Revision[];
  setRevisions: (revisions: Revision[]) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  scanPath: '',
  setScanPath: (path) => set({ scanPath: path }),

  filePlans: [],
  setFilePlans: (plans) => set({ filePlans: plans }),

  revisions: [],
  setRevisions: (revisions) => set({ revisions }),
}));
