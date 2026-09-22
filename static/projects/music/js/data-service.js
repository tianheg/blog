// 数据服务层 — 曲谱查询函数
// 依赖全局 SCORES 数组（定义在 data.js 中）

function getPeriods() {
  const map = {};
  SCORES.forEach(s => { map[s.period] = (map[s.period] || 0) + 1; });
  return Object.entries(map);
}

function getDifficulties() {
  const map = {};
  SCORES.forEach(s => { map[s.difficulty] = (map[s.difficulty] || 0) + 1; });
  return Object.entries(map);
}

function getScoreById(id) {
  return SCORES.find(s => s.id === id);
}

function getScoresByPeriod(period) {
  return SCORES.filter(s => s.period === period);
}

function getScoresByDifficulty(difficulty) {
  return SCORES.filter(s => s.difficulty === difficulty);
}

function searchScores(query) {
  const q = query.toLowerCase().trim();
  if (!q) return SCORES;
  return SCORES.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.composer.toLowerCase().includes(q) ||
    s.opus.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );
}

function getStats() {
  const composers = new Set(SCORES.map(s => s.composer));
  const periods = new Set(SCORES.map(s => s.period));
  return { total: SCORES.length, composers: composers.size, periods: periods.size };
}
