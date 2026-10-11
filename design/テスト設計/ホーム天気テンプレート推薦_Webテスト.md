# ホームの天気・テンプレート推薦（#282）

公開境界はホーム画面のユーザー操作、`HomeController`の入場/選択/地域変更、HTTPクライアント、既存mutation hookの成功処理。ユーザーが自律実装とテスト境界の選択を許可した範囲でTDDを実施する。プライベートな状態や実装文字列で取得整合性を保証しない。

## 実行

CIのwebジョブ（Node 20）に以下を登録。jsdom 26とTesting Libraryは開発依存のみで、lockfileを更新する。ローカルNode 24とCI相当Node 20.20.2でも実行する。

| script | 確認する振る舞い |
| --- | --- |
| `test:home-runtime` | mode切替で旧応答拒否、6時間後/再入場の当日天気再利用、全mode/wardrobe境界の無効化、記録後auto・取得失敗分離、地域revision変更、JST跨日、retry=0、離脱時Abort、409新コンテキスト、タイマー停止中の旧日応答拒否 |
| `test:home-dialogs` | 出典リンク、モーダルの初期focus・Tab循環・Escape・背景非閉鎖・focus復帰、入力中非検索、IME Enter、明示検索/候補選択/保存の分離、保存失敗時の選択保持と送信DTO |
| `test:home-mutations` | 既存7更新経路の実hookをHTTP境界まで実行し、全mode無効化、他wardrobe/天気cache維持、表示推薦再取得、更新前遅延応答拒否 |
| `test:home-screen` | 実画面+hook+HTTPクライアントで5mode、自動初期値、地域未設定、切替中旧カード非表示、候補0/追加導線、20服の4画像+16、revision付き記録callback、末尾白ボタン、履歴タブ保持、旧履歴/服推薦の非取得、復帰時auto/地域読直し |
| `test:home-msw` | 実client→MSWで天気/推薦DTO、地域未設定でも手動成功、最大3件、地域/日付409、当日cache、retryなし、AbortSignal |

初回RED: controller未実装でmode切替テストが失敗。最小実装後GREEN。離脱中断の追加テストでは`signal.aborted=false`でREDとなり、disposeの中断を追加してGREENを確認した。地域・前日競合、全更新経路、DOM操作を順に追加した。

旧ホームの「服推薦・直近履歴・上部記録ボタン」を必須とする3専用検査を廃止し、画面実行テストへ置換する。共通履歴カード・履歴一覧・既存記録画面の検査は維持する。UI基盤/アクセント/ページ件数のホーム前提だけを現仕様へ更新する。

## 境界

MSWはAPI契約と操作確認のための簡略データで、本番の順位計算や天気プロバイダー通信の証明ではない。記録確認/冪等送信は#283、実API結合は#284に引き継ぐ。ダイアログのDOM操作検査に加え、狭幅のブラウザ確認を行う。

## 実行結果

2026-10-11: Node 20.20.2で全Web script 89/89成功。新規5 suitesはNode 24でも成功。TypeScript、production build、`pnpm install --frozen-lockfile`成功。

production exportをChromiumの320×760 viewportで開き、横方向overflowなし、5モード同一行、長い名前/20服のカード3件、情報リンクのEnter起動/Escape閉鎖とfocus復帰、pageerrorなしを確認した。API応答は契約fixtureをHTTP境界で供給し、実プロバイダーへ接続していない。
