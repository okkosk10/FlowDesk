const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const CATEGORY_MAP = {
  // 이미지
  jpg: '이미지', jpeg: '이미지', png: '이미지', gif: '이미지',
  webp: '이미지', svg: '이미지', bmp: '이미지', ico: '이미지',
  // 문서
  pdf: '문서', docx: '문서', doc: '문서', xlsx: '문서',
  xls: '문서', pptx: '문서', ppt: '문서', txt: '문서',
  hwp: '문서', hwpx: '문서',
  // 동영상
  mp4: '동영상', mkv: '동영상', avi: '동영상', mov: '동영상',
  wmv: '동영상', flv: '동영상', webm: '동영상',
  // 음악
  mp3: '음악', flac: '음악', wav: '음악', aac: '음악',
  ogg: '음악', m4a: '음악',
  // 압축
  zip: '압축', rar: '압축', '7z': '압축', tar: '압축',
  gz: '압축', bz2: '압축',
  // 실행파일
  exe: '실행파일', msi: '실행파일', dmg: '실행파일', pkg: '실행파일',
  // 코드
  js: '코드', ts: '코드', py: '코드', java: '코드',
  cpp: '코드', c: '코드', cs: '코드', json: '코드',
  yaml: '코드', yml: '코드', env: '코드',
};

function getCategory(ext) {
  return CATEGORY_MAP[ext.toLowerCase()] ?? '기타';
}

function registerFolderHandlers() {
  ipcMain.handle('folder:list', async (_event, folderPath) => {
    try {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const fullPath = path.join(folderPath, entry.name);
        const stat = fs.statSync(fullPath);
        const ext = path.extname(entry.name).replace('.', '').toLowerCase();

        files.push({
          name: entry.name,
          ext,
          fullPath,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          category: getCategory(ext),
        });
      }

      // 카테고리 → 이름 순 정렬
      files.sort((a, b) =>
        a.category.localeCompare(b.category, 'ko') ||
        a.name.localeCompare(b.name, 'ko')
      );

      return { files };
    } catch (error) {
      return { files: [], error: error.message };
    }
  });
}

module.exports = { registerFolderHandlers };
