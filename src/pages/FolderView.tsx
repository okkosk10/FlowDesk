import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { FileEntry } from '../types';

// ── 파일 크기 포맷 ────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ── 카테고리 배지 색상 ────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  이미지:    { bg: '#1e3a5f', color: '#7dd3fc' },
  문서:      { bg: '#1e3d2f', color: '#86efac' },
  동영상:    { bg: '#3b1f2e', color: '#f9a8d4' },
  음악:      { bg: '#2d1f3d', color: '#c4b5fd' },
  압축:      { bg: '#3b2d1f', color: '#fdba74' },
  실행파일:  { bg: '#3b1f1f', color: '#fca5a5' },
  코드:      { bg: '#1f2f3b', color: '#93c5fd' },
  기타:      { bg: '#2a2a2a', color: '#a3a3a3' },
};

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE['기타'];
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.73rem',
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}

// ── 정렬 키 타입 ──────────────────────────────────────────────────
type SortKey = 'name' | 'category' | 'size' | 'modifiedAt';

export default function FolderView() {
  const { scanPath, fileEntries, setFilePlans, setCurrentPage,
          setTotalScanned, setUnmatchedCount } = useAppStore();
  const [sortKey, setSortKey] = useState<SortKey>('category');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [scanning, setScanning] = useState(false);

  // ── 카테고리 목록 ────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = Array.from(new Set(fileEntries.map((f) => f.category))).sort();
    return ['전체', ...cats];
  }, [fileEntries]);

  // ── 카테고리별 파일 수 요약 ──────────────────────────────────────
  const summary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of fileEntries) {
      map[f.category] = (map[f.category] ?? 0) + 1;
    }
    return map;
  }, [fileEntries]);

  // ── 정렬 + 필터 ──────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list: FileEntry[] =
      filterCategory === '전체'
        ? [...fileEntries]
        : fileEntries.filter((f) => f.category === filterCategory);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'ko');
      else if (sortKey === 'category')
        cmp = a.category.localeCompare(b.category, 'ko') || a.name.localeCompare(b.name, 'ko');
      else if (sortKey === 'size') cmp = a.size - b.size;
      else if (sortKey === 'modifiedAt')
        cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [fileEntries, sortKey, sortAsc, filterCategory]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return <span style={{ color: '#333' }}> ↕</span>;
    return <span style={{ color: '#7dd3fc' }}>{sortAsc ? ' ↑' : ' ↓'}</span>;
  }

  // ── 정리 실행 ────────────────────────────────────────────────────
  async function handleScan() {
    setScanning(true);
    try {
      const result = await window.flowdesk.scanFolder(scanPath);
      if (result.error) {
        alert(`스캔 오류: ${result.error}`);
        return;
      }
      if (result.plans.length === 0) {
        alert('템플릿에 매칭되는 파일이 없습니다.\n설정에서 템플릿을 먼저 등록하세요.');
        return;
      }
      setFilePlans(result.plans);
      setTotalScanned(result.totalScanned ?? result.plans.length);
      setUnmatchedCount(result.unmatchedCount ?? 0);
      setCurrentPage('preview');
    } finally {
      setScanning(false);
    }
  }

  const totalSize = fileEntries.reduce((s, f) => s + f.size, 0);

  return (
    <div className="page folder-view">
      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <button onClick={() => setCurrentPage('dashboard')}>← 뒤로</button>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {scanPath}
          </h2>
          <p style={{ color: '#555', fontSize: '0.8rem', marginTop: 2 }}>
            총 {fileEntries.length}개 파일 · {formatSize(totalSize)}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleScan}
          disabled={scanning || fileEntries.length === 0}
        >
          {scanning ? '분석 중...' : '지금 정리'}
        </button>
      </div>

      {/* ── 카테고리 요약 칩 ─────────────────────────────────────── */}
      <div className="category-chips">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip${filterCategory === cat ? ' chip-active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
            <span className="chip-count">
              {cat === '전체' ? fileEntries.length : (summary[cat] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* ── 파일 테이블 ─────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <p className="empty-msg">표시할 파일이 없습니다.</p>
      ) : (
        <div className="table-wrapper">
          <table className="file-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                  파일명{sortArrow('name')}
                </th>
                <th onClick={() => toggleSort('category')} style={{ cursor: 'pointer' }}>
                  종류{sortArrow('category')}
                </th>
                <th onClick={() => toggleSort('size')} style={{ cursor: 'pointer', width: 90 }}>
                  크기{sortArrow('size')}
                </th>
                <th onClick={() => toggleSort('modifiedAt')} style={{ cursor: 'pointer', width: 160 }}>
                  수정일{sortArrow('modifiedAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((file) => (
                <tr key={file.fullPath}>
                  <td>
                    <span className="file-ext">.{file.ext || '—'}</span>
                    {file.name}
                  </td>
                  <td>
                    <CategoryBadge category={file.category} />
                  </td>
                  <td style={{ color: '#666', fontSize: '0.82rem' }}>
                    {formatSize(file.size)}
                  </td>
                  <td style={{ color: '#555', fontSize: '0.8rem' }}>
                    {new Date(file.modifiedAt).toLocaleString('ko-KR', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
