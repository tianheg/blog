const SCORES = [
  {
    id: '1',
    title: '北方女王',
    composer: '尧十三',
    opus: '',
    difficulty: '中级',
    period: '民谣',
    tags: ['民谣', '华语', '独立音乐'],
    notes: '尧十三的代表作之一，以其独特的叙事风格和情感表达深受听众喜爱。',
    cover: 'img/北方女王.png',
    pages: ['img/北方女王.png']
  },
  {
    id: '2',
    title: '欢乐颂',
    composer: '贝多芬',
    opus: 'Op.125',
    difficulty: '初级',
    period: '古典主义',
    tags: ['交响曲', '合唱', '经典'],
    notes: '《第九交响曲》第四乐章，根据席勒的诗创作，是贝多芬最著名的作品之一，也是古典音乐史上最著名的合唱作品。',
    cover: 'img/欢乐颂.png',
    pages: ['img/欢乐颂.png']
  }
];

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