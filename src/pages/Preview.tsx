import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function Preview() {
  const { filePlans, setFilePlans, setCurrentPage } = useAppStore();
  const [applying, setApplying] = useState(false);

  const included = filePlans.filter((p) => !p.excluded);

  function toggleExclude(id: string) {
    setFilePlans(filePlans.map((p) => (p.id === id ? { ...p, excluded: !p.excluded } : p)));
  }

  function updateTargetName(id: string, name: string) {
    setFilePlans(filePlans.map((p) => (p.id === id ? { ...p, targetName: name } : p)));
  }

  function updateTargetFolder(id: string, folder: string) {
    setFilePlans(filePlans.map((p) => (p.id === id ? { ...p, targetFolder: folder } : p)));
  }

  async function handleApply() {
    if (included.length === 0) return;
    setApplying(true);
    try {
      const result = await window.flowdesk.applyPlan(included);
      if (result.error) {
        alert(`실행 오류: ${result.error}`);
        return;
      }
      setFilePlans([]);
      setCurrentPage('history');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="page preview">
      <div className="page-header">
        <button onClick={() => setCurrentPage('dashboard')}>← 뒤로</button>
        <h2>정리 계획 미리보기</h2>
        <div className="header-actions">
          <button onClick={() => setFilePlans(filePlans.map((p) => ({ ...p, excluded: false })))}>
            전체 선택
          </button>
          <button onClick={() => setFilePlans(filePlans.map((p) => ({ ...p, excluded: true })))}>
            전체 해제
          </button>
        </div>
      </div>

      {filePlans.length === 0 ? (
        <p>정리할 파일이 없습니다.</p>
      ) : (
        <div className="table-wrapper">
          <table className="plan-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>포함</th>
                <th>현재 파일명</th>
                <th>이동 위치</th>
                <th>변경 파일명</th>
                <th>적용 룰</th>
                <th>이유</th>
              </tr>
            </thead>
            <tbody>
              {filePlans.map((plan) => (
                <tr key={plan.id} className={plan.excluded ? 'excluded' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!plan.excluded}
                      onChange={() => toggleExclude(plan.id)}
                    />
                  </td>
                  <td>{plan.originalName}</td>
                  <td>
                    <input
                      type="text"
                      value={plan.targetFolder}
                      onChange={(e) => updateTargetFolder(plan.id, e.target.value)}
                      disabled={plan.excluded}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={plan.targetName}
                      onChange={(e) => updateTargetName(plan.id, e.target.value)}
                      disabled={plan.excluded}
                    />
                  </td>
                  <td>
                    <span className="rule-badge">{plan.appliedRule}</span>
                  </td>
                  <td className="reason-cell">{plan.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="actions">
        <span className="count-label">{included.length}개 파일 선택됨</span>
        <button
          className="btn-primary"
          onClick={handleApply}
          disabled={applying || included.length === 0}
        >
          {applying ? '실행 중...' : `정리 실행 (${included.length}개)`}
        </button>
      </div>
    </div>
  );
}
