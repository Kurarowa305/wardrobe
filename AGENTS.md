- 回答は日本語で行ってください
- pull request のサマリーを日本語で作成してください
- design配下に設計資料があるので参考にしてください
- design/タスク設計配下にタスクの説明があるので参考にしてください
- 実装を修正した際は、テストスクリプトを書き、CIに適用してください。
- PR にテストケースを記載してください
- 依存関係を変更した場合は、必ず pnpm-lock.yaml も更新してコミットしてください。
- 作業後に pnpm install --frozen-lockfile で整合性確認してください。

## Agent skills

### Issue tracker

Issue と仕様は GitHub Issues で管理します。操作時は `docs/agents/issue-tracker.md` を読んでください。

### Triage labels

既定の5種類の triage ラベルを使用します。ラベル操作時は `docs/agents/triage-labels.md` を読んでください。

### Domain docs

single-context 構成です。コード調査前に `docs/agents/domain.md` を読んでください。
