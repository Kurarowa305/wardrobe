# タブバー指定SVG反映テスト設計

## 1. 目的

* ユーザー指定のホーム / 履歴 / テンプレート / 服アイコンSVGコードがタブバー実装へ正確に反映されていることを静的検証で担保する。
* 共通SVGベース実装に、指定された線スタイル（`fill="none"` / `strokeWidth="1.5"` / `strokeLinecap="round"` / `strokeLinejoin="round"`）が適用されていることを確認する。

## 2. 対象

* `apps/web/src/components/app/navigation/TabBarIcon.tsx`
* `apps/web/scripts/check-tab-bar-icon-svg-spec.mjs`
* `apps/web/package.json`
* `.github/workflows/ci.yml`

## 3. テスト観点

### 3.1 各タブのSVG定義

* ホームアイコンが 2 本の `path` を持ち、指定コードと一致すること
* 履歴アイコンが 1 つの `circle` と 2 本の `path` を持ち、指定コードと一致すること
* テンプレートアイコンが 1 本の `path` と 1 つの `rect` を持ち、指定コードと一致すること
* 服アイコンが 1 本の `path` を持ち、指定コードと一致すること

### 3.2 共通線スタイル

* `TabBarIcon` の共通 `svg` が `fill="none"` を持つこと
* `strokeWidth="1.5"`、`strokeLinecap="round"`、`strokeLinejoin="round"` が適用されること
* アクティブ / 非アクティブで `stroke` 色のみ切り替える構造であること

### 3.3 CI組み込み

* `pnpm --filter web test:tab-bar-icon-svg` が `apps/web/package.json` に定義されていること
* GitHub Actions の CI で当該テストが実行されること

## 4. テストケース

| ケースID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| TBS-01 | ホームSVG | `TabBarIcon.tsx` を確認する | ホームアイコンの2本の `path` が指定コードと一致する |
| TBS-02 | 履歴SVG | `TabBarIcon.tsx` を確認する | 履歴アイコンの `circle` と2本の `path` が指定コードと一致する |
| TBS-03 | テンプレートSVG | `TabBarIcon.tsx` を確認する | テンプレートアイコンの `path` / `rect` が指定コードと一致する |
| TBS-04 | 服SVG | `TabBarIcon.tsx` を確認する | 服アイコンの `path` が指定コードと一致する |
| TBS-05 | 共通線スタイル | `TabBarIcon.tsx` を確認する | `fill="none"`、`strokeWidth="1.5"`、`strokeLinecap="round"`、`strokeLinejoin="round"` が設定される |
| TBS-06 | CI組み込み | `package.json` と `ci.yml` を確認する | SVG検証スクリプトが npm script と CI に登録されている |

## 5. 実装方針

* Node.js スクリプト `apps/web/scripts/check-tab-bar-icon-svg-spec.mjs` で各SVG要素と共通線スタイルの必要文字列を検証する。
* 既存の `check-tab-bar-icons-spec.mjs` とは責務を分け、タブバー構造・レイアウト検証とSVGコード一致検証を独立してCIで継続実行する。
