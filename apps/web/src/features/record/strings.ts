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
