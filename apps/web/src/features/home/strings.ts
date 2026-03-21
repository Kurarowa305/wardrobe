export const HOME_STRINGS = {
  titlePlaceholder: "ワードローブ名",
  actions: {
    addRecord: "＋ 着た記録",
    viewAllHistories: "履歴を全て見る",
  },
  toasts: {
    wardrobeCreated: {
      title: "ワードローブを作成しました",
      description: "ホーム画面に移動しました。",
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
