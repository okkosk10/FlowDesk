# FlowDesk

> 흐르는 파일을 조용히 정리합니다

FlowDesk는 Electron + React + TypeScript 기반의 데스크탑 파일 정리 앱입니다.  
폴더를 선택하면 템플릿 규칙에 따라 파일을 자동으로 분류·이동하고, 언제든지 이전 상태로 복구할 수 있습니다.

## 주요 기능

- **폴더 스캔** — 선택한 폴더의 파일 목록을 불러옵니다
- **템플릿 기반 분류** — 확장자 또는 파일명 키워드로 파일을 원하는 폴더로 이동합니다
- **미리보기** — 정리 계획을 적용 전 확인하고 개별 항목을 제외할 수 있습니다
- **리비전 복구** — 정리 이력을 저장하여 파일을 원래 위치로 되돌릴 수 있습니다
- **기본 템플릿** — 이미지·문서·동영상·음악·압축파일·실행파일·코드 등 기본 규칙 제공

## 기술 스택

| 영역 | 기술 |
|------|------|
| UI | React 19, TypeScript, Zustand |
| 빌드 | Vite, Electron |
| DB | better-sqlite3 (SQLite) |
| 패키징 | electron-builder |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (웹 + Electron 동시)
npm run dev

# 앱 빌드 (배포용 인스톨러 생성)
npm run build:app
```

> `better-sqlite3` 네이티브 모듈 재빌드가 필요한 경우:
> ```bash
> npm run rebuild
> ```

## 프로젝트 구조

```
electron/          # Electron 메인 프로세스
  main.cjs
  preload.cjs
  core/            # 파일 스캔 & 템플릿 매칭 로직
  db/              # SQLite 스키마 & 쿼리
  ipc/             # IPC 핸들러 (폴더, 이동, 복구, 스캔)
src/               # React 렌더러 프로세스
  pages/           # Dashboard / FolderView / Preview / History / Settings
  store/           # Zustand 전역 상태
  types/           # 공유 타입 정의
```
