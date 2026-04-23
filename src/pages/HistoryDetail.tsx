import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { RevisionDetail, FileMove, RevisionLog } from '../types';

// ─── 상태 배지 ────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  moved:    { label: '이동됨',    cls: 'badge-moved' },
  failed:   { label: '실패',      cls: 'badge-failed' },
  skipped:  { label: '건너뜀',   cls: 'badge-skipped' },
  restored: { label: '복구됨',   cls: 'badge-restored' },
  conflict: { label: '충돌',      cls: 'badge-conflict' },
  deleted:  { label: '삭제됨',   cls: 'badge-deleted' },
  modified: { label: '수정됨',   cls: 'badge-modified' },
};

function StatusBadge({ status }: { status: FileMove['status'] }) {
  const b = STATUS_BADGE[status] ?? { label: status, cls: '' };
  return <span className={`status-badge ${b.cls}`}>{b.label}</span>;
}

// ─── 로그 타입 배지 ──────────────────────────────────────────────
const LOG_BADGE: Record<string, { label: string; cls: string }> = {
  info:  { label: 'INFO',  cls: 'log-info' },
  warn:  { label: 'WARN',  cls: 'log-warn' },
  error: { label: 'ERROR', cls: 'log-error' },
  debug: { label: 'DEBUG', cls: 'log-debug' },
};

function LogBadge({ logType }: { logType: RevisionLog['logType'] }) {
  const b = LOG_BADGE[logType] ?? { label: logType.toUpperCase(), cls: '' };
  return <span className={`log-badge ${b.cls}`}>{b.label}</span>;
}

// ─── 경로 단축 ────────────────────────────────────────────────────
function shortPath(p: string | null, maxLen = 50): string {
  if (!p) return '—';
  if (p.length <= maxLen) return p;
  return '…' + p.slice(-(maxLen - 1));
}

// ─── 통계 카드 ───────────────────────────────────────────────────
function StatCard({ label, value, cls = '' }: { label: string; value: number; cls?: string }) {
  return (
    <div className={`stat-card ${cls}`}>
      <div className="stat-value">{value.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ─── Summary 탭 ──────────────────────────────────────────────────
function SummaryTab({ detail }: { detail: RevisionDetail }) {
  const { revision: r } = detail;
  return (
    <div className="detail-summary">
      <div className="summary-info">
        <div><span className="info-key">폴더</span><span className="info-val">{r.basePath || '—'}</span></div>
        <div><span className="info-key">실행 시각</span><span className="info-val">{new Date(r.createdAt).toLocaleString('ko-KR')}</span></div>
        {r.note && <div><span className="info-key">메모</span><span className="info-val">{r.note}</span></div>}
      </div>
      <div className="stat-cards">
        <StatCard label="전체 스캔"  value={r.totalScanned} />
        <StatCard label="계획"        value={r.plannedCount} />
        <StatCard label="성공"        value={r.successCount} cls="stat-success" />
        <StatCard label="실패"        value={r.failCount}    cls="stat-fail" />
        <StatCard label="미매칭"      value={r.unmatchedCount} />
      </div>
    </div>
  );
}

// ─── Files 탭 ────────────────────────────────────────────────────
function FilesTab({ files }: { files: FileMove[] }) {
  if (files.length === 0) return <p className="empty-msg">파일 기록이 없습니다.</p>;

  return (
    <div className="table-wrapper">
      <table className="detail-table">
        <thead>
          <tr>
            <th>원본 파일명</th>
            <th>이동 위치</th>
            <th>템플릿</th>
            <th style={{ width: 90 }}>상태</th>
            <th>사유</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id} className={f.status === 'failed' ? 'row-failed' : ''}>
              <td title={f.originalPath}>
                {f.originalPath.split(/[\\/]/).pop() ?? f.originalPath}
              </td>
              <td className="mono" title={f.targetPath ?? ''}>
                {shortPath(f.targetPath)}
              </td>
              <td>{f.templateName ?? '—'}</td>
              <td><StatusBadge status={f.status} /></td>
              <td className="reason-cell" title={f.reason ?? ''}>
                {f.status === 'failed' && f.reason
                  ? <span className="reason-text">{f.reason}</span>
                  : f.reason
                    ? <span className="reason-muted">{f.reason}</span>
                    : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Logs 탭 ─────────────────────────────────────────────────────
function LogsTab({ logs }: { logs: RevisionLog[] }) {
  if (logs.length === 0) return <p className="empty-msg">로그가 없습니다.</p>;

  return (
    <ul className="log-list">
      {logs.map((log) => (
        <li key={log.id} className={`log-item log-item-${log.logType}`}>
          <div className="log-header">
            <LogBadge logType={log.logType} />
            <span className="log-time">
              {new Date(log.createdAt).toLocaleTimeString('ko-KR')}
            </span>
          </div>
          <div className="log-message">{log.message}</div>
          {log.metaJson && (
            <pre className="log-meta">{JSON.stringify(JSON.parse(log.metaJson), null, 2)}</pre>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── HistoryDetail 메인 ──────────────────────────────────────────
type Tab = 'summary' | 'files' | 'logs';

export default function HistoryDetail() {
  const { setCurrentPage, selectedRevisionId } = useAppStore();
  const [detail,  setDetail]  = useState<RevisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>('summary');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!selectedRevisionId) { setCurrentPage('history'); return; }
    window.flowdesk.getRevisionDetail(selectedRevisionId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [selectedRevisionId]);

  async function handleRestore() {
    if (!selectedRevisionId) return;
    setRestoring(true);
    try {
      await window.flowdesk.restoreRevision(selectedRevisionId);
      // 파일 목록 새로고침
      const fresh = await window.flowdesk.getRevisionDetail(selectedRevisionId);
      setDetail(fresh);
    } finally {
      setRestoring(false);
    }
  }

  if (loading) return <div className="page"><p>불러오는 중...</p></div>;
  if (!detail) return <div className="page"><p className="empty-msg">리비전을 찾을 수 없습니다.</p></div>;

  const { revision: r } = detail;

  return (
    <div className="page history-detail">
      {/* ── 헤더 ─── */}
      <div className="page-header">
        <button onClick={() => setCurrentPage('history')}>← 목록으로</button>
        <div style={{ flex: 1 }}>
          <h2>Revision #{r.id}</h2>
          <p className="detail-sub">{new Date(r.createdAt).toLocaleString('ko-KR')}</p>
        </div>
        <button onClick={handleRestore} disabled={restoring}>
          {restoring ? '복구 중...' : '전체 복구'}
        </button>
      </div>

      {/* ── 탭 ─── */}
      <div className="tabs">
        {(['summary', 'files', 'logs'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'summary' ? '요약'
             : t === 'files' ? `파일 (${detail.files.length})`
             : `로그 (${detail.logs.length})`}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ─── */}
      <div className="tab-content">
        {tab === 'summary' && <SummaryTab detail={detail} />}
        {tab === 'files'   && <FilesTab   files={detail.files} />}
        {tab === 'logs'    && <LogsTab    logs={detail.logs} />}
      </div>
    </div>
  );
}
