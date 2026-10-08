# Agent skills セットアップテスト設計

## 目的

エンジニアリングスキルの設定ファイルへの参照と、合意した設定の整合性を CI で確認する。

## 対象スクリプト

- `scripts/check-agent-skills-spec.mjs`
- 実行コマンド: `node --test scripts/check-agent-skills-spec.mjs`
- Node.js 標準ライブラリのみを使用する。

## テストケース

| ID | 観点 | 期待結果 |
| --- | --- | --- |
| AS-01 | 設定への導線 | Agent skills ブロックが1つあり、異なる3つの設定ファイルに参照し、参照先が存在して空でない |
| AS-02 | Issue 管理先 | GitHub、Kurarowa305/wardrobe、gh の作成・閲覧操作が指定され、PR triage フラグが no |
| AS-03 | triage ラベル | 既定の5つの role が同名ラベルに一対一で対応 |
| AS-04 | ドメイン資料 | single-context を指定し、GLOSSARY.md、docs/adr/、既存の design/ とタスク設計を参照 |

GLOSSARY.md と docs/adr/ は必要時に作成するため、実在をテストの条件にしない。
テストはドキュメントの契約を確認し、GitHub Issue やラベルの作成は行わない。

## CI 適用

`.github/workflows/ci.yml` の checks ジョブで上記コマンドを実行する。

## PR サマリー

AS-01〜AS-04 のテストケースと実行結果を記載する。
