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
      loadMore: "テンプレートをさらに読み込む",
    },
    messages: {
      loading: "テンプレートを読み込み中...",
      loadError: "テンプレート一覧の読み込みに失敗しました。",
      empty: "選択できるテンプレートがまだ登録されていません。",
      dateRequired: "日付を入力してください。",
      templateRequired: "記録に使うテンプレートを選択してください。",
      submitting: "記録中...",
      submitError: "履歴の記録に失敗しました。",
    },
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
