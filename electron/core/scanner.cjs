const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 파일 fingerprint: 앞 4KB 해시 + 파일 크기
 * 파일 변경 여부 판단에 사용
 */
function getFingerprint(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const readSize = Math.min(stat.size, 4096);
    const buffer = Buffer.alloc(readSize);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, 0);
    fs.closeSync(fd);
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    return `${hash}_${stat.size}`;
  } catch {
    return null;
  }
}

/**
 * 폴더 최상위 파일만 스캔 (하위 폴더 제외)
 */
function scanFolder(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(folderPath, entry.name);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(entry.name).toLowerCase().replace('.', '');

    files.push({
      name: entry.name,
      ext,
      fullPath,
      size: stat.size,
      fingerprint: getFingerprint(fullPath),
    });
  }

  return files;
}

module.exports = { scanFolder, getFingerprint };
