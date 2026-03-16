export const CLOTHING_STRINGS = {
  list: {
    title: "服",
    actions: {
      add: "＋ 服を追加",
      loadMore: "さらに読み込む",
    },
    messages: {
      loading: "読み込み中...",
      empty: "服がまだ登録されていません。",
      error: "服一覧の読み込みに失敗しました。",
    },
  },
  create: {
    title: "服の追加",
    labels: {
      image: "画像",
      name: "服の名前",
    },
    actions: {
      submit: "追加",
    },
  },
  edit: {
    title: "服の編集",
    labels: {
      image: "画像",
      name: "服の名前",
    },
    actions: {
      submit: "保存",
    },
  },
  detail: {
    title: "服の詳細",
    menu: {
      edit: "編集",
      delete: "削除",
    },
  },
} as const;
