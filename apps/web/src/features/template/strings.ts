export const TEMPLATE_STRINGS = {
  placeholders: {
    name: "例: 通勤コーデ",
  },
  actions: {
    cancel: "キャンセル",
    loadMoreClothings: "服をさらに読み込む",
  },
  messages: {
    clothingLoading: "服一覧を読み込み中...",
    clothingLoadError: "服一覧の読み込みに失敗しました。",
    clothingEmpty: "選択できる服がまだ登録されていません。",
    clothingRequired: "テンプレートに含める服を1つ以上選択してください。",
    templateNotFound: "テンプレートが見つかりませんでした。",
  },
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
    messages: {
      loadError: "テンプレート追加画面の読み込みに失敗しました。",
      nameRequired: "テンプレート名を入力してください。",
      submitting: "追加中...",
      submitError: "テンプレートの追加に失敗しました。",
    },
    labels: {
      name: "テンプレート名",
      selectClothing: "服を選択",
    },
    actions: {
      submit: "追加",
    },
  },
  edit: {
    title: "テンプレートの編集",
    messages: {
      loading: "読み込み中...",
      loadError: "テンプレート編集画面の読み込みに失敗しました。",
      nameRequired: "テンプレート名を入力してください。",
      submitting: "保存中...",
      submitError: "テンプレートの更新に失敗しました。",
    },
    labels: {
      name: "テンプレート名",
      selectClothing: "服を選択",
    },
    actions: {
      submit: "保存",
    },
  },
  detail: {
    title: "テンプレートの詳細",
    menu: {
      edit: "編集",
      delete: "削除",
    },
    labels: {
      wearCount: "着た回数",
      lastWornAt: "最後に着た日",
      clothingItems: "構成アイテム",
      clothingWearCount: "着た回数",
      clothingLastWornAt: "最後に着た日",
    },
    messages: {
      loading: "読み込み中...",
      error: "テンプレート詳細の読み込みに失敗しました。",
      deleteError: "テンプレートの削除に失敗しました。",
      deleted: "削除済みのテンプレートです。",
      clothingDeleted: "削除済みの服です",
      neverWorn: "未着用",
    },
  },
} as const;
