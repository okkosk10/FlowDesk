import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { scanPath, setScanPath, setFilePlans, setCurrentPage } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectFolder() {
    const selected = await window.flowdesk.selectFolder();
    if (selected) setScanPath(selected);
  }

  async function handleScan() {
    if (!scanPath) return;
    setScanning(true);
    setError(null);
    try {
      const result = await window.flowdesk.scanFolder(scanPath);
      if (result.error) {
        setError(result.error);
      } else if (result.plans.length === 0) {
        setError('정리할 파일이 없거나 템플릿에 매칭되는 파일이 없습니다. 설정에서 템플릿을 확인하세요.');
      } else {
        setFilePlans(result.plans);
        setCurrentPage('preview');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="page dashboard">
      <h1>FlowDesk</h1>
      <p className="subtitle">흐르는 파일을 조용히 정리합니다</p>

      <div className="folder-select">
        <input
          type="text"
          value={scanPath}
          readOnly
          placeholder="정리할 폴더를 선택하세요"
        />
        <button onClick={handleSelectFolder}>폴더 선택</button>
      </div>

      {error && <p className="error">{error}</p>}

      <button
        className="btn-primary"
        onClick={handleScan}
        disabled={!scanPath || scanning}
      >
        {scanning ? '스캔 중...' : '지금 정리'}
      </button>

      <div className="nav-links">
        <button onClick={() => setCurrentPage('history')}>정리 기록</button>
        <button onClick={() => setCurrentPage('settings')}>설정 / 템플릿</button>
      </div>
    </div>
  );
}
