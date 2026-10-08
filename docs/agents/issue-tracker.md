# Issue tracker: GitHub

Issue と仕様は Kurarowa305/wardrobe の GitHub Issues で管理します。
リポジトリ内から gh CLI を使用してください。

## 操作規約

- 作成: `gh issue create --title "..." --body-file <path>`
- 閲覧: `gh issue view <number> --comments`
- 一覧: `gh issue list --state open --json number,title,body,labels`
- コメント: `gh issue comment <number> --body-file <path>`
- ラベル追加: `gh issue edit <number> --add-label "..."`
- ラベル削除: `gh issue edit <number> --remove-label "..."`
- クローズ: `gh issue close <number> --comment "..."`

複数行の本文はファイルに保存し、--body-file で渡してください。
対象リポジトリは git remote から判断し、必要なら
`--repo Kurarowa305/wardrobe` を指定してください。

## Pull requests as a triage surface

**PRs as a request surface: no.**

## スキルからの指示

「Issue tracker に公開する」は GitHub Issue の作成を意味します。
「関連チケットを取得する」は `gh issue view <number> --comments` を意味します。
