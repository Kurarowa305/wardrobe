export const RECORD_STRINGS = {
  method: {
    title: "記録",
    message: "どの方法で記録しますか？",
    actions: {
      byTemplate: "テンプレートで記録",
      byCombination: "服の組み合わせで記録",
    },
  },
  byTemplate: {
    title: "テンプレートで記録",
    labels: {
      date: "日付",
      template: "テンプレート",
    },
    actions: {
      submit: "記録",
      loadMore: "さらに読み込む",
    },
    messages: {
      loading: "読み込み中...",
      empty: "記録に使えるテンプレートがありません。",
      loadError: "テンプレート一覧の読み込みに失敗しました。",
      dateRequired: "日付を入力してください。",
      templateRequired: "テンプレートを選択してください。",
      submitting: "記録中...",
      submitError: "記録の作成に失敗しました。",
    },
  },
  actions: {
    cancel: "キャンセル",
  },
  byCombination: {
    title: "服の組み合わせで記録",
    labels: {
      date: "日付",
      clothing: "服",
    },
    actions: {
      submit: "記録",
    },
  },
} as const;
