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
    placeholders: {
      image: "画像キー（任意）",
      name: "例: 白シャツ",
    },
    actions: {
      submit: "追加",
    },
    messages: {
      nameRequired: "服の名前を入力してください。",
      submitting: "追加中...",
      submitError: "服の追加に失敗しました。",
    },
  },
  edit: {
    title: "服の編集",
    labels: {
      image: "画像",
      name: "服の名前",
    },
    placeholders: {
      image: "画像キー（任意）",
      name: "例: 白シャツ",
    },
    actions: {
      submit: "保存",
    },
    messages: {
      loading: "読み込み中...",
      loadError: "服編集画面の読み込みに失敗しました。",
      nameRequired: "服の名前を入力してください。",
      submitting: "保存中...",
      submitError: "服の更新に失敗しました。",
    },
  },
  detail: {
    title: "服の詳細",
    menu: {
      edit: "編集",
      delete: "削除",
    },
    messages: {
      loading: "読み込み中...",
      error: "服詳細の読み込みに失敗しました。",
      notFound: "服が見つかりませんでした。",
      deleted: "削除済み",
      deleteError: "服の削除に失敗しました。",
    },
  },
} as const;
