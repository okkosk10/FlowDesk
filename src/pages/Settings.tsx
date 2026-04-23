import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Template } from '../types';

// ─── 기본 템플릿 ───────────────────────────────────────────────────
const DEFAULT_TEMPLATES: Omit<Template, 'id' | 'priority'>[] = [
  { name: '이미지',    extensions: 'jpg,jpeg,png,gif,webp,svg,bmp,ico', keywords: '', targetFolder: 'Images',     renamePattern: null, autoApply: 1, enabled: 1, description: '이미지 파일 모음' },
  { name: '문서',      extensions: 'pdf,docx,doc,xlsx,xls,pptx,ppt,txt,hwp,hwpx', keywords: '', targetFolder: 'Documents',  renamePattern: null, autoApply: 1, enabled: 1, description: '문서 파일 모음' },
  { name: '동영상',    extensions: 'mp4,mkv,avi,mov,wmv,flv,webm',      keywords: '', targetFolder: 'Videos',     renamePattern: null, autoApply: 1, enabled: 1, description: '동영상 파일 모음' },
  { name: '음악',      extensions: 'mp3,flac,wav,aac,ogg,m4a',          keywords: '', targetFolder: 'Music',      renamePattern: null, autoApply: 1, enabled: 1, description: '음악 파일 모음' },
  { name: '압축파일',  extensions: 'zip,rar,7z,tar,gz,bz2',             keywords: '', targetFolder: 'Archives',   renamePattern: null, autoApply: 1, enabled: 1, description: '압축 파일 모음' },
  { name: '실행파일',  extensions: 'exe,msi,dmg,pkg',                   keywords: '', targetFolder: 'Installers', renamePattern: null, autoApply: 0, enabled: 1, description: '설치 파일 모음' },
  { name: '코드/개발', extensions: 'js,ts,py,java,cpp,c,cs,json,yaml,yml,env', keywords: '', targetFolder: 'Code', renamePattern: null, autoApply: 0, enabled: 1, description: '개발 관련 파일' },
];

// ─── 빈 폼 ──────────────────────────────────────────────────────────
const EMPTY_FORM: Omit<Template, 'id' | 'priority'> = {
  name: '', extensions: '', keywords: '', targetFolder: '',
  renamePattern: null, autoApply: 1, enabled: 1, description: '',
};

// ─── Toast ──────────────────────────────────────────────────────────
type ToastType = 'success' | 'error';
interface ToastState { msg: string; type: ToastType; key: number }

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast.key, onClose]);

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.msg}
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// ─── ConfirmModal ───────────────────────────────────────────────────
function ConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">템플릿 삭제</h3>
        <p className="modal-body">
          <strong>"{name}"</strong> 템플릿을 삭제할까요?
        </p>
        <p className="modal-notice">
          이 템플릿으로 정리된 기존 리비전에는 영향이 없습니다.
        </p>
        <div className="modal-actions">
          <button onClick={onCancel}>취소</button>
          <button className="btn-danger" onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  );
}

// ─── TemplateForm ───────────────────────────────────────────────────
function TemplateForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Template | null;
  onSave: (data: Omit<Template, 'id' | 'priority'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Template, 'id' | 'priority'>>(
    initial
      ? {
          name:          initial.name,
          extensions:    initial.extensions,
          keywords:      initial.keywords,
          targetFolder:  initial.targetFolder,
          renamePattern: initial.renamePattern,
          autoApply:     initial.autoApply,
          enabled:       initial.enabled,
          description:   initial.description,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.targetFolder.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form className="template-form" onSubmit={handleSubmit}>
      <h3 className="form-title">{initial ? '템플릿 수정' : '새 템플릿 추가'}</h3>

      <div className="form-grid">
        <label className="form-label">
          템플릿 이름 <span className="required">*</span>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="예) 이미지"
            required
          />
        </label>

        <label className="form-label">
          대상 폴더명 <span className="required">*</span>
          <input
            className="form-input"
            value={form.targetFolder}
            onChange={(e) => set('targetFolder', e.target.value)}
            placeholder="예) Images"
            required
          />
        </label>

        <label className="form-label">
          확장자 목록
          <input
            className="form-input"
            value={form.extensions}
            onChange={(e) => set('extensions', e.target.value)}
            placeholder="jpg,png,gif  (쉼표 구분)"
          />
        </label>

        <label className="form-label">
          키워드 목록
          <input
            className="form-input"
            value={form.keywords}
            onChange={(e) => set('keywords', e.target.value)}
            placeholder="report,invoice  (쉼표 구분)"
          />
        </label>

        <label className="form-label form-full">
          설명
          <input
            className="form-input"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="이 템플릿에 대한 간단한 설명"
          />
        </label>

        <div className="form-toggles">
          <label className="toggle-label">
            <span>자동 적용</span>
            <div
              className={`toggle ${form.autoApply ? 'toggle-on' : ''}`}
              onClick={() => set('autoApply', form.autoApply ? 0 : 1)}
            >
              <div className="toggle-thumb" />
            </div>
          </label>
          <label className="toggle-label">
            <span>활성화</span>
            <div
              className={`toggle ${form.enabled ? 'toggle-on' : ''}`}
              onClick={() => set('enabled', form.enabled ? 0 : 1)}
            >
              <div className="toggle-thumb" />
            </div>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>취소</button>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving || !form.name.trim() || !form.targetFolder.trim()}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}

// ─── Settings (메인) ────────────────────────────────────────────────
export default function Settings() {
  const { setCurrentPage } = useAppStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formMode, setFormMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastKey = useRef(0);

  function showToast(msg: string, type: ToastType = 'success') {
    toastKey.current += 1;
    setToast({ msg, type, key: toastKey.current });
  }

  async function reload() {
    const data = await window.flowdesk.getTemplates();
    setTemplates(data);
  }

  useEffect(() => {
    reload().then(() => setLoading(false));
  }, []);

  async function handleLoadDefaults() {
    setSaving(true);
    try {
      for (const t of DEFAULT_TEMPLATES) {
        await window.flowdesk.saveTemplate({ ...t, priority: 0 });
      }
      await reload();
      showToast('기본 템플릿을 불러왔습니다.');
    } catch {
      showToast('기본 템플릿 불러오기 실패', 'error');
    }
    setSaving(false);
  }

  async function handleAdd(data: Omit<Template, 'id' | 'priority'>) {
    try {
      await window.flowdesk.saveTemplate({ ...data, priority: templates.length });
      await reload();
      setFormMode('none');
      showToast(`"${data.name}" 템플릿이 추가되었습니다.`);
    } catch {
      showToast('템플릿 추가 실패', 'error');
    }
  }

  async function handleUpdate(data: Omit<Template, 'id' | 'priority'>) {
    if (!editTarget) return;
    try {
      await window.flowdesk.updateTemplate({ ...editTarget, ...data });
      await reload();
      setFormMode('none');
      setEditTarget(null);
      showToast(`"${data.name}" 템플릿이 수정되었습니다.`);
    } catch {
      showToast('템플릿 수정 실패', 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await window.flowdesk.deleteTemplate(deleteTarget.id);
      await reload();
      showToast(`"${deleteTarget.name}" 템플릿이 삭제되었습니다.`);
    } catch {
      showToast('템플릿 삭제 실패', 'error');
    }
    setDeleteTarget(null);
  }

  async function handleToggleEnabled(t: Template) {
    try {
      await window.flowdesk.updateTemplate({ ...t, enabled: t.enabled ? 0 : 1 });
      await reload();
    } catch {
      showToast('상태 변경 실패', 'error');
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= templates.length) return;
    const reordered = [...templates];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setTemplates(reordered);
    try {
      await window.flowdesk.reorderTemplates(reordered.map((t) => t.id));
    } catch {
      await reload();
      showToast('순서 변경 실패', 'error');
    }
  }

  return (
    <div className="page settings">
      {toast && (
        <Toast toast={toast} onClose={() => setToast(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="page-header">
        <button onClick={() => setCurrentPage('dashboard')}>← 뒤로</button>
        <h2>설정 / 템플릿 관리</h2>
        <div className="header-actions">
          <button onClick={() => { setEditTarget(null); setFormMode('add'); }}>+ 새 템플릿 추가</button>
          <button onClick={handleLoadDefaults} disabled={saving}>
            {saving ? '저장 중...' : '기본 템플릿 불러오기'}
          </button>
        </div>
      </div>

      <p className="settings-desc">
        확장자 또는 키워드 기준으로 파일을 분류합니다. 자동 적용 off는 미리보기에서 수동 확인이 필요합니다.
        비활성 템플릿은 매칭에서 제외됩니다. 순서(▲▼)가 매칭 우선순위입니다.
      </p>

      {formMode !== 'none' && (
        <TemplateForm
          initial={formMode === 'edit' ? editTarget : null}
          onSave={formMode === 'edit' ? handleUpdate : handleAdd}
          onCancel={() => { setFormMode('none'); setEditTarget(null); }}
        />
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : templates.length === 0 ? (
        <p className="empty-msg">등록된 템플릿이 없습니다. 기본 템플릿을 불러오세요.</p>
      ) : (
        <table className="template-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>순서</th>
              <th>이름</th>
              <th>확장자</th>
              <th>키워드</th>
              <th>이동 폴더</th>
              <th>자동</th>
              <th>활성</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t, idx) => (
              <tr key={t.id} className={t.enabled ? '' : 'row-disabled'}>
                <td className="priority-cell">
                  <button
                    className="icon-btn"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    title="우선순위 올리기"
                  >▲</button>
                  <button
                    className="icon-btn"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === templates.length - 1}
                    title="우선순위 내리기"
                  >▼</button>
                </td>
                <td>
                  <strong>{t.name}</strong>
                  {t.description && (
                    <span className="desc-text"> — {t.description}</span>
                  )}
                </td>
                <td className="mono">{t.extensions || '—'}</td>
                <td className="mono">{t.keywords || '—'}</td>
                <td>{t.targetFolder}</td>
                <td>
                  <span className={t.autoApply ? 'badge-on' : 'badge-off'}>
                    {t.autoApply ? '자동' : '수동'}
                  </span>
                </td>
                <td>
                  <div
                    className={`toggle toggle-sm ${t.enabled ? 'toggle-on' : ''}`}
                    onClick={() => handleToggleEnabled(t)}
                    title={t.enabled ? '클릭하여 비활성화' : '클릭하여 활성화'}
                  >
                    <div className="toggle-thumb" />
                  </div>
                </td>
                <td className="action-cell">
                  <button
                    className="icon-btn"
                    onClick={() => { setEditTarget(t); setFormMode('edit'); }}
                    title="수정"
                  >✏️</button>
                  <button
                    className="icon-btn btn-danger"
                    onClick={() => setDeleteTarget(t)}
                    title="삭제"
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
