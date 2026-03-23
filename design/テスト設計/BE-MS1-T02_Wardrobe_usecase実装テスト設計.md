# BE-MS1-T02 Wardrobe usecase 実装テスト設計

## 目的
- BE-MS1-T02（Wardrobe usecase 実装）の完了条件を継続的に検証する。
- ワードローブ作成時の UUIDv7 採番と、取得時の `NOT_FOUND` 変換が API 実装前に崩れないことを保証する。

## 対象
- `apps/api/src/domains/wardrobe/usecases/wardrobeUsecase.ts`
- `apps/api/scripts/check-wardrobe-usecase-spec.mjs`
- `.github/workflows/ci.yml`

## テスト方針
- 実DynamoDB接続は行わず、usecase に注入した repo スタブへの入出力を検証する。
- create は「ID採番」「`createdAt` 注入」「repo.create 呼び出し」の 3 点を最重要観点とする。
- get は repo 返却値から Wardrobe META を取り出して DTO へ整形できること、および欠損時に共通 `NOT_FOUND` エラーへ変換できることを確認する。
- 追加した検証スクリプトが package script と CI に接続されていることも確認する。

## テストケース

### WU-01 generateWardrobeId が `wd_` プレフィックス付き UUIDv7 を返す
- 観点: 完了条件「createで UUIDv7 を採番する」
- 入力: `generateWardrobeId()` / `generateUuidV7()` を呼ぶ
- 期待値:
  - `wardrobeId` が `wd_` で始まる
  - UUID 本体が version 7 / RFC4122 variant の形式に一致する

### WU-02 create usecase が repo.create へ採番済み ID と作成時刻を渡す
- 観点: create usecase の永続化入力整形
- 入力: `create({ name: "My Wardrobe" })`
- 期待値:
  - 返り値に生成した `wardrobeId` を含む
  - repo.create が 1 回呼ばれる
  - repo.create の引数に `wardrobeId`, `name`, `createdAt` が含まれる

### WU-03 get usecase が Wardrobe META を DTO に変換する
- 観点: 取得成功時のレスポンス整形
- 入力: repo.get が `Item` に META アイテムを返す状態で `get({ wardrobeId })`
- 期待値:
  - `wardrobeId`, `name`, `createdAt` を返す

### WU-04 get usecase が存在しないワードローブを `NOT_FOUND` に変換する
- 観点: 完了条件「getで存在しない場合 `NOT_FOUND` を返す」
- 入力: repo.get が空結果を返す状態で `get({ wardrobeId: "wd_missing" })`
- 期待値:
  - `AppError`
  - `code = NOT_FOUND`
  - `status = 404`
  - `details.resource = "wardrobe"`
  - `details.wardrobeId = "wd_missing"`

### WU-05 テスト導線のCI組み込み
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:wardrobe-usecase` がある
  - `.github/workflows/ci.yml` で `pnpm --filter api test:wardrobe-usecase` が実行される
