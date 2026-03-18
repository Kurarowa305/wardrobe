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
      clothingItems: "着用した服",
      clothingWearCount: "着用回数",
      clothingLastWornAt: "最終着用日",
    },
    messages: {
      loading: "読み込み中...",
      error: "履歴詳細の読み込みに失敗しました。",
      notFound: "履歴が見つかりませんでした。",
      combinationSummary: "選択した服の組み合わせ",
      clothingDeleted: "削除済みの服です",
      neverWorn: "未着用",
    },
  },
  labels: {
    inputType: {
      template: "テンプレート入力",
      combination: "組み合わせ入力",
    },
  },
} as const;
