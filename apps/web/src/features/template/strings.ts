export const TEMPLATE_STRINGS = {
  list: {
    title: "テンプレート",
    actions: {
      add: "＋ テンプレートを追加",
    },
  },
  create: {
    title: "テンプレートの追加",
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
  },
} as const;
