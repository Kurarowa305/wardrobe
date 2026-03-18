export const TEMPLATE_STRINGS = {
  list: {
    title: "テンプレート",
    actions: {
      add: "＋ テンプレートを追加",
      loadMore: "さらに読み込む",
    },
    messages: {
      loading: "読み込み中...",
      empty: "テンプレートがまだ登録されていません。",
      error: "テンプレート一覧の読み込みに失敗しました。",
    },
    badges: {
      deleted: "削除済み",
    },
  },
  create: {
    title: "テンプレートの追加",
    labels: {
      name: "テンプレート名",
      selectClothing: "服を選択",
    },
    placeholders: {
      name: "例: 通勤コーデ",
    },
    actions: {
      submit: "追加",
    },
    messages: {
      loading: "服一覧を読み込み中...",
      loadError: "テンプレート追加画面の読み込みに失敗しました。",
      nameRequired: "テンプレート名を入力してください。",
      clothingRequired: "構成服を1つ以上選択してください。",
      submitError: "テンプレートの追加に失敗しました。",
      submitting: "追加中...",
      emptyClothing: "選択できる服がまだ登録されていません。",
    },
  },
  edit: {
    title: "テンプレートの編集",
    labels: {
      name: "テンプレート名",
      selectClothing: "服を選択",
    },
    placeholders: {
      name: "例: 通勤コーデ",
    },
    actions: {
      submit: "保存",
    },
    messages: {
      loading: "読み込み中...",
      loadError: "テンプレート編集画面の読み込みに失敗しました。",
      clothingLoadError: "服一覧の読み込みに失敗しました。",
      nameRequired: "テンプレート名を入力してください。",
      clothingRequired: "構成服を1つ以上選択してください。",
      submitError: "テンプレートの更新に失敗しました。",
      submitting: "保存中...",
      emptyClothing: "選択できる服がまだ登録されていません。",
    },
  },
  detail: {
    title: "テンプレートの詳細",
    messages: {
      notFound: "テンプレートが見つかりません。",
    },
    menu: {
      edit: "編集",
      delete: "削除",
    },
  },
} as const;
