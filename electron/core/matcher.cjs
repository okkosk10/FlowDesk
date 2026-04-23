const path = require('path');
const { randomUUID } = require('crypto');

/**
 * 파일 하나에 대해 매칭되는 첫 번째 템플릿을 반환
 * 확장자 → 키워드 순으로 우선 매칭
 */
function matchTemplate(file, templates) {
  // enabled=1인 템플릿만, priority ASC 순서로 평가
  const active = [...templates]
    .filter((t) => t.enabled !== 0)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  for (const template of active) {
    const extensions = template.extensions
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const keywords = template.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const extMatch = extensions.length > 0 && extensions.includes(file.ext);
    const keywordMatch =
      keywords.length > 0 &&
      keywords.some((k) => file.name.toLowerCase().includes(k));

    if (extMatch || keywordMatch) {
      return { template, matchedBy: extMatch ? 'extension' : 'keyword' };
    }
  }
  return null;
}

/**
 * 파일 목록과 템플릿으로 정리 계획(FilePlan[]) 생성
 */
function buildPlans(files, templates, scanPath) {
  const plans = [];

  for (const file of files) {
    const match = matchTemplate(file, templates);
    if (!match) continue;

    const { template, matchedBy } = match;
    const targetFolder = path.join(scanPath, template.target_folder);
    const reason =
      matchedBy === 'extension'
        ? `확장자 .${file.ext} → ${template.name} 템플릿`
        : `파일명 키워드 매칭 → ${template.name} 템플릿`;

    plans.push({
      id: randomUUID(),
      originalPath: file.fullPath,
      originalName: file.name,
      targetFolder,
      targetName: file.name,
      appliedRule: template.name,
      reason,
      excluded: false,
    });
  }

  return plans;
}

module.exports = { buildPlans };
