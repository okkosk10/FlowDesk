// ─── 폴더 파일 목록 ────────────────────────────────────────────────
export interface FileEntry {
  name: string;
  ext: string;
  fullPath: string;
  size: number;
  modifiedAt: string;   // ISO datetime string
  category: string;     // 이미지 | 문서 | 동영상 | 음악 | 압축 | 실행파일 | 코드 | 기타
}

export interface FolderListResult {
  files: FileEntry[];
  error?: string;
}

// ─── 정리 계획 단위 ────────────────────────────────────────────────
export interface FilePlan {
  id: string;           // 클라이언트 UUID (DB에 저장 안 됨)
  originalPath: string;
  originalName: string;
  targetFolder: string;
  targetName: string;
  appliedRule: string;
  reason: string;
  excluded: boolean;
}

// ─── 정리 실행 단위 ────────────────────────────────────────────────
export interface Revision {
  id: number;
  createdAt: string;    // ISO datetime string
  fileCount: number;
  label: string | null;
}

// ─── 파일 이동 기록 ────────────────────────────────────────────────
export interface FileRecord {
  id: number;
  revisionId: number;
  originalPath: string;
  targetPath: string;
  originalName: string;
  targetName: string;
  appliedRule: string;
  fingerprint: string | null;
  status: 'moved' | 'restored' | 'conflict' | 'deleted' | 'modified';
}

// ─── 분류 템플릿 ───────────────────────────────────────────────────
export interface Template {
  id: number;
  name: string;
  extensions: string;    // 쉼표 구분: "jpg,png,gif"
  keywords: string;      // 쉼표 구분: "report,invoice"
  targetFolder: string;
  renamePattern: string | null;
  autoApply: number;     // SQLite boolean: 0 | 1
}

// ─── IPC 응답 ─────────────────────────────────────────────────────
export interface ScanResult {
  plans: FilePlan[];
  error?: string;
}

export interface ApplyResult {
  revisionId?: number;
  successCount?: number;
  failed?: { name: string; reason: string }[];
  error?: string;
}

export interface RestoreItemResult {
  id: number;
  status: 'restored' | 'deleted' | 'modified' | 'conflict';
  path?: string;
}

// ─── 앱 페이지 ────────────────────────────────────────────────────
export type Page = 'dashboard' | 'folder-view' | 'preview' | 'history' | 'settings';
