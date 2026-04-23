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

// ─── 정리 실행 단위
 export interface Revision {
  id: number;
  basePath: string;
  createdAt: string;    // ISO datetime string
  note: string | null;
  fileCount: number;    // = successCount (backward compat)
  label?: string | null;
  totalScanned: number;
  plannedCount: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  conflictCount: number;
  unmatchedCount: number;
}

// ─── 파일 이동 기록 (신규)
export interface FileMove {
  id: number;
  revisionId: number;
  originalPath: string;
  targetPath: string | null;
  finalName: string | null;
  templateId: number | null;
  templateName: string | null;
  status: 'moved' | 'failed' | 'skipped' | 'restored' | 'conflict' | 'deleted' | 'modified';
  reason: string | null;
  fingerprint: string | null;
  createdAt: string;
}

// ─── 실행 로그
export interface RevisionLog {
  id: number;
  revisionId: number;
  logType: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  createdAt: string;
  metaJson: string | null;
}

// ─── Revision 상세 (로드 시 한 번에)
export interface RevisionDetail {
  revision: Revision;
  files: FileMove[];
  logs: RevisionLog[];
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
  enabled: number;       // SQLite boolean: 0 | 1 (비활성화 시 matcher 제외)
  description: string;   // 템플릿 설명
  priority: number;      // 낮을수록 먼저 매칭
}

// ─── IPC 응답 ─────────────────────────────────────────────────────
export interface ScanResult {
  plans: FilePlan[];
  totalScanned: number;
  unmatchedCount: number;
  error?: string;
}

export interface ApplyInput {
  basePath: string;
  plans: FilePlan[];
  totalScanned?: number;
  unmatchedCount?: number;
  note?: string;
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
export type Page = 'dashboard' | 'folder-view' | 'preview' | 'history' | 'history-detail' | 'settings';
