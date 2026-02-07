# UIコンポーネント設計資料

## 1. 目的

* 画面仕様を実装可能な単位に分解し、再利用・保守性の高いUI構造を定義する
* shadcn/ui を土台に、アプリ固有コンポーネントの責務を明確化する
* UI層から文言・ドメイン知識・データ取得を分離し、仕様変更に強い構造にする

---

## 2. 設計原則

### 2.1 レイヤ分離

* **components/**：見た目とUI操作のみ（受け身）
* **features/**：画面ロジック（データ取得、ViewModel生成、strings適用、遷移）
* **domain/**：意味（概念モデル）
* **api/**：通信スキーマ

### 2.2 components の責務

* props で渡された値を描画する
* UIイベントを外へ通知する（onClick 等）
* 文言・ビジネスルール・API都合の判断は持たない
  （例外：ThumbnailList の「最大4＋`+x`」のような純UIルール）

### 2.3 文言の扱い

* 文言は `constants/commonStrings.ts` と `features/*/strings.ts` に集約
* components は文言をベタ書きしない（propsで受け取る）

---

## 3. ディレクトリ構成

```
src/components/
  ui/                          # shadcn/ui（生成物。基本編集しない）
    button.tsx
    card.tsx
    dialog.tsx
    dropdown-menu.tsx
    input.tsx
    label.tsx
    scroll-area.tsx
    separator.tsx
    tabs.tsx
    textarea.tsx
    ...（必要に応じて追加）

  app/                         # アプリ固有UI
    layout/
      AppLayout.tsx            # Header + Content + TabBar の枠
      Screen.tsx               # 画面の余白/スクロール
      Section.tsx              # 見出し＋内容ブロック

    navigation/
      Header.tsx               # title/left/right slot
      BackButton.tsx
      TabBar.tsx               # 4タブ（home/history/template/clothing）
      OverflowMenu.tsx         # ︙（itemsを受け取る）

    primitives/
      Thumbnail.tsx            # 画像/no image/削除済み
      ThumbnailList.tsx        # 最大4 +x
      EmptyState.tsx
      LoadingSkeleton.tsx

    cards/
      BasicCard.tsx            # 汎用カード枠（クリック可）
      HistoryCard.tsx          # 履歴カード（クリック可）
      TemplateCard.tsx         # テンプレカード（クリック可）
      ClothingCard.tsx         # 服カード（クリック可：服一覧用）
      ClothingRow.tsx          # 服行（表示専用：タップ不可）

    forms/
      fields/
        TextField.tsx          # Label + Input + error
        DateField.tsx          # 日付入力（時間なし）
        ImagePickerField.tsx   # 画像選択（任意）
      selectors/
        ClothingMultiSelect.tsx  # 複数選択UI
        TemplateSingleSelect.tsx # 単一選択UI
      blocks/
        ClothingForm.tsx       # 服追加/編集共通（initial注入）
        TemplateForm.tsx       # テンプレ追加/編集共通（initial注入）
        RecordMethod.tsx       # 記録（方法選択）
        RecordByTemplateForm.tsx     # 記録（テンプレ）
        RecordByCombinationForm.tsx  # 記録（組み合わせ）

    dialogs/
      ConfirmDialog.tsx        # 削除/破棄確認（title/message/labelsを受け取る）

  index.ts                      # app配下の再export（任意）

```

---

## 4. コンポーネント一覧（責務・主要 props）

### 4.1 layout

#### AppLayout

**責務**：画面外枠（Header / Content / TabBar）を統合。タブバー表示を制御。
**主要props**：`header`, `children`, `tabBar?`

#### Screen

**責務**：画面共通のスクロール領域・余白を統一。
**主要props**：`children`, `scroll?`

#### Section

**責務**：見出し＋コンテンツ枠。
**主要props**：`title?`, `children`

---

### 4.2 navigation

#### Header

**責務**：左/中央/右スロットの枠。中央タイトルは画面側が決めて渡す。
**主要props**：`title`, `left?`, `right?`

#### BackButton

**責務**：戻る操作のUI。破棄確認の判断は画面側。
**主要props**：`onBack`

#### TabBar / TabBarItem

**責務**：4タブのUI。選択状態と遷移通知。
**主要props（TabBar）**：`active`, `onChange`

#### OverflowMenu（︙）

**責務**：詳細画面のメニュー（編集/削除）。項目は画面側が渡す。
**主要props**：`items: { key, label, onSelect }[]`

---

### 4.3 primitives

#### Thumbnail

**責務**：画像 / `no image` / 削除済みオーバーレイを統一表示。
**主要props**：`src?`, `alt`, `deleted?`, `size?`

#### ThumbnailList

**責務**：サムネ最大4件 + `+x` 表示を統一。
**主要props**：`items`, `max?`（default 4）

#### EmptyState

**責務**：空状態の表示。
**主要props**：`message`, `action?`

#### LoadingSkeleton

**責務**：ローディング表示。
**主要props**：`variant`, `count?`

---

### 4.4 cards（重要：ClothingRowは表示専用）

#### BasicCard

**責務**：クリック可能カードの枠。
**主要props**：`children`, `onClick?`, `disabled?`

#### HistoryCard（クリック可能）

**責務**：履歴カード（ホーム/履歴一覧）。
**主要props**：`dateLabel`, `inputTypeLabel`, `title`, `thumbnails`, `onClick`

#### TemplateCard（クリック可能）

**責務**：テンプレカード（テンプレート一覧）。
**主要props**：`name`, `thumbnails`, `onClick`

#### ClothingCard（クリック可能）

**責務**：服カード（服一覧）。服詳細へ遷移するためのカード。
**主要props**：`name`, `thumbnail`, `onClick`

#### ClothingRow（表示専用・タップ不可）

**責務**：服の「確認用行表示」（履歴詳細など）。
**主要props**：`name`, `thumbnail`
**注意**：`onClick` を持たない（常にタップ不可）

---

### 4.5 forms

#### fields/TextField

**責務**：ラベル付きテキスト入力。
**主要props**：`label`, `value`, `onChange`, `required?`, `error?`

#### fields/DateField（時間なし）

**責務**：記録画面の日付入力（必須、時間は扱わない）。
**主要props**：`label`, `value`, `onChange`, `required?`, `error?`

#### fields/ImagePickerField

**責務**：服画像入力（任意）。
**主要props**：`label`, `value?`, `onPick`, `onClear?`

#### selectors/ClothingMultiSelect

**責務**：服の複数選択UI。
**主要props**：`items`, `selectedIds`, `onToggle`

#### selectors/TemplateSingleSelect

**責務**：テンプレの単一選択UI。
**主要props**：`items`, `selectedId?`, `onSelect`

#### blocks/ClothingForm（追加/編集共通）

**責務**：服フォーム共通。編集は初期値を画面側が注入。
**主要props**：`initial`, `submitLabel`, `onSubmit`, `onBack`

#### blocks/TemplateForm（追加/編集共通）

**責務**：テンプレフォーム共通。編集は初期値を画面側が注入。
**主要props**：`initial`, `submitLabel`, `onSubmit`, `onBack`

#### blocks/RecordMethod

**責務**：記録方法選択（2択）。戻るあり。
**主要props**：`message`, `byTemplateLabel`, `byCombinationLabel`, `onSelectTemplate`, `onSelectCombination`, `onBack`

#### blocks/RecordByTemplateForm / RecordByCombinationForm

**責務**：記録入力（共通：日付必須、戻るあり、完了はホーム）。
**主要props（共通）**：`dateValue`, `onChangeDate`, `submitLabel`, `onSubmit`, `onBack`

---

### 4.6 dialogs

#### ConfirmDialog

**責務**：削除確認 / 破棄確認の共通UI。
**主要props**：`open`, `title`, `message`, `primaryLabel`, `secondaryLabel`, `onPrimary`, `onSecondary`

---

## 5. 仕様反映チェック（要点）

* ヘッダー中央：ホームはワードローブ名、その他は画面名称（featuresで決定）
* 記録：日付のみ（時間なし）
* 履歴詳細：服一覧は表示のみ（ClothingRow）、服詳細へ遷移しない
* 追加/詳細/編集/記録：すべて戻る操作あり
* 編集画面：現在の入力内容を初期値として表示（文言表示は不要）

---

# 画面×コンポーネント対応表（詳細）

> 表中の「ui/*」は shadcn/ui を指す（例：ui/button, ui/dialog, ui/card など）

| 画面           | レイアウト                             | ナビゲーション                                                  | 表示（cards/primitives）                          | 入力（forms）                                                                    | モーダル（dialogs）                |
| ------------ | --------------------------------- | -------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| ワードローブ作成     | AppLayout（tabなし）, Screen          | Header（title=ワードローブ作成）, BackButton（必要なら※）                | -                                             | TextField（ワードローブ名）, PrimaryButton（作成）                                        | ConfirmDialog（破棄確認：入力変更時の戻る） |
| ホーム          | AppLayout（tabあり）, Screen, Section | Header（title=ワードローブ名）, TabBar                            | HistoryCard（複数）, ThumbnailList                | AddButton（＋ 着た記録）, SecondaryButton（履歴を全て見る）                                  | -                            |
| 履歴一覧         | AppLayout（tabあり）, Screen          | Header（title=履歴）, TabBar                                 | HistoryCard（複数）, LoadingSkeleton, EmptyState  | -                                                                            | -                            |
| 履歴詳細         | AppLayout（tabなし）, Screen          | Header（title=履歴詳細）, BackButton, OverflowMenu（編集/削除）      | ClothingRow（複数・タップ不可）, Thumbnail              | -                                                                            | ConfirmDialog（削除確認）          |
| テンプレート一覧     | AppLayout（tabあり）, Screen          | Header（title=テンプレート）, TabBar                             | TemplateCard（複数）, LoadingSkeleton, EmptyState | AddButton（＋ テンプレートを追加）                                                       | -                            |
| テンプレート追加     | AppLayout（tabなし）, Screen          | Header（title=テンプレートの追加）, BackButton                      | -                                             | TemplateForm（initial空）, ClothingMultiSelect, TextField, PrimaryButton（追加）    | ConfirmDialog（破棄確認）          |
| テンプレート編集     | AppLayout（tabなし）, Screen          | Header（title=テンプレートの編集）, BackButton                      | -                                             | TemplateForm（initial=現在値）, ClothingMultiSelect, TextField, PrimaryButton（保存） | ConfirmDialog（破棄確認）          |
| テンプレート詳細     | AppLayout（tabなし）, Screen          | Header（title=テンプレートの詳細）, BackButton, OverflowMenu（編集/削除） | ClothingRow（構成服・タップ不可）, ThumbnailList         | -                                                                            | ConfirmDialog（削除確認）          |
| 服一覧          | AppLayout（tabあり）, Screen          | Header（title=服）, TabBar                                  | ClothingCard（複数）, LoadingSkeleton, EmptyState | AddButton（＋ 服を追加）                                                            | -                            |
| 服追加          | AppLayout（tabなし）, Screen          | Header（title=服の追加）, BackButton                           | Thumbnail（プレビュー）                              | ClothingForm（initial空）, ImagePickerField, TextField, PrimaryButton（追加）       | ConfirmDialog（破棄確認）          |
| 服編集          | AppLayout（tabなし）, Screen          | Header（title=服の編集）, BackButton                           | Thumbnail（プレビュー）                              | ClothingForm（initial=現在値）, ImagePickerField, TextField, PrimaryButton（保存）    | ConfirmDialog（破棄確認）          |
| 服詳細          | AppLayout（tabなし）, Screen          | Header（title=服の詳細）, BackButton, OverflowMenu（編集/削除）      | Thumbnail（大）, Text（服名）                        | -                                                                            | ConfirmDialog（削除確認）          |
| 記録（方法選択）     | AppLayout（tabなし）, Screen          | Header（title=記録）, BackButton                             | BasicCard（2択）                                 | RecordMethod（2択）                                                             | -                            |
| 記録（テンプレで記録）  | AppLayout（tabなし）, Screen          | Header（title=テンプレートで記録）, BackButton                      | TemplateCard（選択用） or TemplateSingleSelect     | DateField（日付）, TemplateSingleSelect, PrimaryButton（記録）                       | -                            |
| 記録（組み合わせで記録） | AppLayout（tabなし）, Screen          | Header（title=服の組み合わせで記録）, BackButton                     | ClothingRow（選択済み確認用・タップ不可）                    | DateField（日付）, ClothingMultiSelect, PrimaryButton（記録）                        | -                            |

---

## 補足（表の読み方）

* 「ClothingRow」は **常に表示専用**。
  遷移が必要な場面（服一覧など）は **ClothingCard** を使用する。
* 「破棄確認」は追加/編集/記録の戻る操作で、入力変更がある場合に表示（画面側で制御）。
* 履歴詳細の戻る先（ホーム or 履歴一覧）は遷移元依存（画面側で制御）。

---
