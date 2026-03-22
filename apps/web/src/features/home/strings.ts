export const HOME_STRINGS = {
  titlePlaceholder: "ワードローブ名",
  actions: {
    addRecord: "＋ 記録する",
    viewAllHistories: "履歴を全て見る",
  },
  toasts: {
    wardrobeCreated: {
      title: "ワードローブを作成しました",
    },
    historyCreated: {
      title: "記録を追加しました",
    },
    historyDeleted: {
      title: "履歴を削除しました",
    },
  },
  sections: {
    recentWeekHistories: "直近1週間の履歴",
  },
  messages: {
    loadingRecentHistories: "履歴を読み込み中...",
    errorRecentHistories: "履歴の読み込みに失敗しました。",
    emptyRecentHistories: "直近1週間の履歴はまだありません。",
  },
} as const;
