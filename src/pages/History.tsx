import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Revision, RestoreItemResult } from '../types';

export default function History() {
  const { setCurrentPage, setSelectedRevisionId } = useAppStore();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [results,   setResults]   = useState<RestoreItemResult[] | null>(null);
  const [deleting,  setDeleting]  = useState<number | null>(null);

  async function reload() {
    const data = await window.flowdesk.listRevisions();
    setRevisions(data);
  }

  useEffect(() => {
    reload().then(() => setLoading(false));
  }, []);

  async function handleRestore(revisionId: number) {
    setRestoring(revisionId);
    setResults(null);
    try {
      const res = await window.flowdesk.restoreRevision(revisionId);
      setResults(res);
      await reload();
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(revisionId: number) {
    if (!confirm(`Revision #${revisionId}을 삭제할까요?\n파일은 현재 위치에 그대로 남습니다.`)) return;
    setDeleting(revisionId);
    try {
      await window.flowdesk.deleteRevision(revisionId);
      await reload();
    } finally {
      setDeleting(null);
    }
  }

  function handleDetail(id: number) {
    setSelectedRevisionId(id);
    setCurrentPage('history-detail');
  }

  const statusLabel: Record<string, string> = {
    restored: '✅ 복구됨',
    deleted:  '🗑 삭제됨 (복구 불가)',
    modified: '✏️ 수정됨 (건너뜀)',
    conflict: '⚠️ 충돌 (건너뜀)',
  };

  return (
    <div className="page history">
      <div className="page-header">
        <button onClick={() => setCurrentPage('dashboard')}>← 뒤로</button>
        <h2>정리 기록</h2>
      </div>

      {results && (
        <div className="restore-results">
          <h3>복구 결과</h3>
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                {statusLabel[r.status] ?? r.status}
                {r.path && <span className="result-path"> — {r.path}</span>}
              </li>
            ))}
          </ul>
          <button onClick={() => setResults(null)}>닫기</button>
        </div>
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : revisions.length === 0 ? (
        <p className="empty-msg">정리 기록이 없습니다.</p>
      ) : (
        <ul className="revision-list">
          {revisions.map((rev) => (
            <li key={rev.id} className="revision-item">
              <div className="revision-meta">
                <div className="revision-top">
                  <span className="revision-id">Revision #{rev.id}</span>
                  <span className="revision-date">
                    {new Date(rev.createdAt).toLocaleString('ko-KR')}
                  </span>
                  {rev.basePath && (
                    <span className="revision-path" title={rev.basePath}>
                      {rev.basePath.length > 40
                        ? '…' + rev.basePath.slice(-38)
                        : rev.basePath}
                    </span>
                  )}
                </div>
                <div className="revision-stats">
                  {rev.totalScanned > 0 && (
                    <span className="stat-chip">스캔 {rev.totalScanned}</span>
                  )}
                  <span className="stat-chip stat-success">성공 {rev.successCount ?? rev.fileCount}</span>
                  {(rev.failCount ?? 0) > 0 && (
                    <span className="stat-chip stat-fail">실패 {rev.failCount}</span>
                  )}
                  {(rev.unmatchedCount ?? 0) > 0 && (
                    <span className="stat-chip stat-skip">미매칭 {rev.unmatchedCount}</span>
                  )}
                </div>
              </div>
              <div className="revision-actions">
                <button onClick={() => handleDetail(rev.id)}>상세 보기</button>
                <button
                  onClick={() => handleRestore(rev.id)}
                  disabled={restoring === rev.id}
                >
                  {restoring === rev.id ? '복구 중...' : '전체 복구'}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(rev.id)}
                  disabled={deleting === rev.id}
                >
                  {deleting === rev.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
