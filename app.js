const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'products.json');
const loadData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const USES = ['毎日用', '減量用', '競技者用'];
const USE_LEAD = {
  毎日用: 'タンパク質の割合を中心に、バランスよく見ています。',
  減量用: '糖質と脂質が少ないものを重く見ています。',
  競技者用: 'アンチドーピング認証など、品質の裏付けを重く見ています。',
};
const SORTS = [['performance', '性能点が高い順'], ['value', 'コスパ点が高い順'], ['yen', 'タンパク質1gが安い順']];

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.get('/', (req, res) => {
  const { products, updatedAt } = loadData();
  const use = USES.includes(req.query.use) ? req.query.use : '毎日用';
  const sort = SORTS.some(([v]) => v === req.query.sort) ? req.query.sort : 'performance';
  const type = req.query.type || '';
  const q = (req.query.q || '').trim();

  const scored = products.filter(p => p.scored);
  const types = [...new Set(scored.map(p => p.type))];
  let list = scored.filter(p => (!type || p.type === type) && (!q || `${p.brand} ${p.name} ${p.flavor} ${(p.flavors || []).join(' ')}`.toLowerCase().includes(q.toLowerCase())));
  const key = {
    performance: p => -p.performance[use],
    value: p => -(p.value[use] * 10 + p.performance[use]),
    yen: p => p.yenPerGram,
  }[sort];
  list = list.sort((a, b) => key(a) - key(b));

  res.render('home', {
    title: 'proteinplac｜プロテインを点数で比べる',
    description: `${scored.length}種類のプロテインを、成分表示と価格から同じルールで点数化して比べられます。`,
    products: list, total: scored.length, pending: products.filter(p => !p.scored),
    uses: USES, use, useLead: USE_LEAD[use], sorts: SORTS, sort, types, type, q, updatedAt,
  });
});

app.get('/protein/:id', (req, res, next) => {
  const { products } = loadData();
  const p = products.find(x => x.id === req.params.id);
  if (!p) return next();
  const ranks = p.scored ? Object.fromEntries(USES.map(u => {
    const l = products.filter(x => x.scored).sort((a, b) => b.performance[u] - a.performance[u]);
    return [u, { rank: l.indexOf(p) + 1, of: l.length }];
  })) : null;
  res.render('product', {
    title: `${p.brand} ${p.name}の点数と成分｜proteinplac`,
    description: `${p.brand} ${p.name}（${p.type}）の性能点・コスパ点と、成分表示・タンパク質1gあたりの価格。`,
    p, uses: USES, ranks,
  });
});

app.get('/method', (req, res) => {
  res.render('method', { title: '点数の付け方｜proteinplac', description: 'proteinplac の性能点とコスパ点の計算方法。' });
});

app.get('/__health', (_req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).render('404', { title: 'ページが見つかりません｜proteinplac' }));

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`proteinplac listening on ${PORT}`));
