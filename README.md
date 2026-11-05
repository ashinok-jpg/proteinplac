# proteinplac

プロテインを成分表示と価格から同じルールで点数化して比べるサイト。runnersplac の姉妹サイト。

## 動かす

```bash
npm install
npm start   # http://localhost:3100
```

## データの更新

1. `research/protein-data-request.csv` を直す（ルールは `research/scoring-rules.md`）
2. `npm run score` で点数を計算し直し、`data/products.json` を作り直す
3. コミットして push すると Render が自動でデプロイする
