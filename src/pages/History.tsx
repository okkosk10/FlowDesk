import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Revision, RestoreItemResult } from '../types';

export default function History() {
  const { setCurrentPage } = useAppStore();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [results, setResults] = useState<RestoreItemResult[] | null>(null);

  useEffect(() => {
    window.flowdesk.getRevisions().then((data) => {
      setRevisions(data);
      setLoading(false);
    });
  }, []);

  async function handleRestore(revisionId: number) {
    setRestoring(revisionId);
    setResults(null);
    try {
      const res = await window.flowdesk.restoreRevision(revisionId);
      setResults(res);
      const updated = await window.flowdesk.getRevisions();
      setRevisions(updated);
    } finally {
      setRestoring(null);
    }
  }

  const statusLabel: Record<string, string> = {
    restored: '✅ 복구됨',
    deleted: '🗑 삭제됨 (복구 불가)',
    modified: '✏️ 수정됨 (건너뜀)',
    conflict: '⚠️ 충돌 (건너뜀)',
  };

  return (
    <div className="page history">
      <div className="page-header">
        <button onClick={() => setCurrentPage('dashboard')}>← 뒤로</button>
        <h2>정리 기록 / 리비전 복구</h2>
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
              <div className="revision-info">
                <span className="revision-id">Revision #{rev.id}</span>
                <span className="revision-date">
                  {new Date(rev.createdAt).toLocaleString('ko-KR')}
                </span>
                <span className="revision-count">{rev.fileCount}개 파일</span>
                {rev.label && <span className="revision-label">{rev.label}</span>}
              </div>
              <button
                onClick={() => handleRestore(rev.id)}
                disabled={restoring === rev.id}
              >
                {restoring === rev.id ? '복구 중...' : '전체 복구'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
