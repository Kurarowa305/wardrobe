export const RECORD_STRINGS = {
  common: {
    deleted: "削除済み",
  },
  method: {
    title: "記録",
    message: "どの方法で記録しますか？",
    actions: {
      byTemplate: "テンプレートで記録",
      byCombination: "服の組み合わせで記録",
    },
    descriptions: {
      byTemplate: "服装テンプレートから選択します",
      byCombination: "服を選んで組み合わせます",
    },
  },
  byTemplate: {
    title: "テンプレートで記録",
    labels: { date: "日付", template: "テンプレート" },
    actions: { submit: "記録", loadMore: "さらに読み込む" },
    messages: {
      loading: "テンプレートを読み込んでいます…",
      loadError: "テンプレート一覧の取得に失敗しました。時間をおいて再度お試しください。",
      empty: "記録できるテンプレートがまだありません。先にテンプレートを追加してください。",
      dateRequired: "日付を入力してください。",
      templateRequired: "テンプレートを選択してください。",
      submitting: "記録しています…",
      submitSuccess: "記録を追加しました",
      submitError: "記録に失敗しました。時間をおいて再度お試しください。",
    },
  },
  byCombination: {
    title: "服の組み合わせで記録",
    labels: { date: "日付", clothing: "服" },
    actions: { submit: "記録", loadMore: "さらに読み込む" },
    messages: {
      loading: "服を読み込んでいます…",
      loadError: "服一覧の取得に失敗しました。時間をおいて再度お試しください。",
      empty: "記録できる服がまだありません。先に服を追加してください。",
      sectionEmpty: "このジャンルで選択できる服はまだありません。",
      dateRequired: "日付を入力してください。",
      clothingRequired: "服を1着以上選択してください。",
      submitting: "記録しています…",
      submitError: "記録に失敗しました。時間をおいて再度お試しください。",
    },
  },
} as const;
