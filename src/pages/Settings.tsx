import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Template } from '../types';

const DEFAULT_TEMPLATES: Omit<Template, 'id'>[] = [
  { name: '이미지',    extensions: 'jpg,jpeg,png,gif,webp,svg,bmp,ico', keywords: '', targetFolder: 'Images',     renamePattern: null, autoApply: 1 },
  { name: '문서',      extensions: 'pdf,docx,doc,xlsx,xls,pptx,ppt,txt,hwp,hwpx', keywords: '', targetFolder: 'Documents',  renamePattern: null, autoApply: 1 },
  { name: '동영상',    extensions: 'mp4,mkv,avi,mov,wmv,flv,webm',      keywords: '', targetFolder: 'Videos',     renamePattern: null, autoApply: 1 },
  { name: '음악',      extensions: 'mp3,flac,wav,aac,ogg,m4a',          keywords: '', targetFolder: 'Music',      renamePattern: null, autoApply: 1 },
  { name: '압축파일',  extensions: 'zip,rar,7z,tar,gz,bz2',             keywords: '', targetFolder: 'Archives',   renamePattern: null, autoApply: 1 },
  { name: '실행파일',  extensions: 'exe,msi,dmg,pkg',                   keywords: '', targetFolder: 'Installers', renamePattern: null, autoApply: 0 },
  { name: '코드/개발', extensions: 'js,ts,py,java,cpp,c,cs,json,yaml,yml,env', keywords: '', targetFolder: 'Code', renamePattern: null, autoApply: 0 },
];

export default function Settings() {
  const { setCurrentPage } = useAppStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.flowdesk.getTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  async function handleLoadDefaults() {
    setSaving(true);
    for (const t of DEFAULT_TEMPLATES) {
      await window.flowdesk.saveTemplate(t);
    }
    const updated = await window.flowdesk.getTemplates();
    setTemplates(updated);
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await window.flowdesk.deleteTemplate(id);
    setTemplates(templates.filter((t) => t.id !== id));
  }

  return (
    <div className="page settings">
      <div className="page-header">
        <button onClick={() => setCurrentPage('dashboard')}>← 뒤로</button>
        <h2>설정 / 템플릿 관리</h2>
        <button onClick={handleLoadDefaults} disabled={saving}>
          {saving ? '저장 중...' : '기본 템플릿 불러오기'}
        </button>
      </div>

      <p className="settings-desc">
        템플릿은 확장자 또는 키워드를 기준으로 파일을 분류합니다. 자동 적용이 꺼진 템플릿은 미리보기에서 수동 확인이 필요합니다.
      </p>

      {loading ? (
        <p>불러오는 중...</p>
      ) : templates.length === 0 ? (
        <p className="empty-msg">등록된 템플릿이 없습니다. 기본 템플릿을 불러오세요.</p>
      ) : (
        <table className="template-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>확장자</th>
              <th>키워드</th>
              <th>이동 폴더</th>
              <th>자동 적용</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong></td>
                <td className="mono">{t.extensions || '—'}</td>
                <td className="mono">{t.keywords || '—'}</td>
                <td>{t.targetFolder}</td>
                <td>
                  <span className={t.autoApply ? 'badge-on' : 'badge-off'}>
                    {t.autoApply ? '자동' : '수동'}
                  </span>
                </td>
                <td>
                  <button className="btn-danger" onClick={() => handleDelete(t.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
