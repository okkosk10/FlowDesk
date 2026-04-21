import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { setScanPath, setFileEntries, setCurrentPage } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectFolder() {
    const selected = await window.flowdesk.selectFolder();
    if (!selected) return;

    setScanPath(selected);
    setLoading(true);
    setError(null);

    try {
      const result = await window.flowdesk.listFiles(selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFileEntries(result.files);
      setCurrentPage('folder-view');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page dashboard">
      <h1>FlowDesk</h1>
      <p className="subtitle">흐르는 파일을 조용히 정리합니다</p>

      {error && <p className="error">{error}</p>}

      <button
        className="btn-primary"
        onClick={handleSelectFolder}
        disabled={loading}
        style={{ fontSize: '1.05rem', padding: '14px 36px' }}
      >
        {loading ? '불러오는 중...' : '폴더 열기'}
      </button>

      <div className="nav-links">
        <button onClick={() => setCurrentPage('history')}>정리 기록</button>
        <button onClick={() => setCurrentPage('settings')}>설정 / 템플릿</button>
      </div>
    </div>
  );
}

