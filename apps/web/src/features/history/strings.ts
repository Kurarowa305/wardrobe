export const HISTORY_STRINGS = {
  list: {
    title: "履歴",
    actions: {
      loadMore: "さらに読み込む",
    },
    messages: {
      loading: "読み込み中...",
      empty: "履歴がまだ登録されていません。",
      error: "履歴一覧の読み込みに失敗しました。",
      combinationSummary: "選択した服の組み合わせ",
    },
    badges: {
      deleted: "削除済み",
    },
  },
  detail: {
    title: "履歴詳細",
    menu: {
      edit: "編集",
      delete: "削除",
    },
    labels: {
      date: "日付",
      inputType: "入力方法",
      template: "着たテンプレート",
      clothingItems: "着た服",
      templateWearCount: "着た回数",
      clothingWearCount: "着た回数",
    },
    messages: {
      loading: "読み込み中...",
      error: "履歴詳細の読み込みに失敗しました。",
      notFound: "履歴が見つかりませんでした。",
      combinationSummary: "選択した服の組み合わせ",
      clothingDeleted: "削除済みの服です",
      deleteSuccess: "履歴を削除しました",
      deleteError: "履歴の削除に失敗しました。",
    },
  },
  labels: {
    inputType: {
      template: "テンプレート入力",
      combination: "組み合わせ入力",
    },
  },
} as const;
