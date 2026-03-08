export const COMMON_STRINGS = {
  actions: {
    add: "追加",
    save: "保存",
    record: "記録",
    edit: "編集",
    delete: "削除",
    cancel: "キャンセル",
    discard: "破棄",
    viewAll: "全て見る",
  },
  dialogs: {
    confirmDelete: {
      title: "削除しますか？",
      message: "この操作は取り消せません",
      primary: "削除",
      secondary: "キャンセル",
    },
    confirmDiscard: {
      title: "入力を破棄しますか？",
      message: "入力途中の内容は保存されません",
      primary: "破棄",
      secondary: "キャンセル",
    },
  },
  placeholders: {
    noImage: "no image",
  },
} as const;
