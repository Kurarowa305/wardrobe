export const HOME_STRINGS = {
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
    clothingRecommendations: "おすすめの服",
    recentWeekHistories: "直近1週間の履歴",
  },
  seasons: {
    spring: "春",
    summer: "夏",
    autumn: "秋",
    winter: "冬",
  },
  messages: {
    loadingClothingRecommendations: "おすすめの服を読み込み中...",
    errorClothingRecommendations: "おすすめの服の読み込みに失敗しました。",
    emptyClothingRecommendations: "おすすめの服はまだありません。",
    emptyClothingRecommendationGenre: "おすすめはまだありません。",
    loadingRecentHistories: "履歴を読み込み中...",
    errorRecentHistories: "履歴の読み込みに失敗しました。",
    emptyRecentHistories: "直近1週間の履歴はまだありません。",
  },
} as const;
