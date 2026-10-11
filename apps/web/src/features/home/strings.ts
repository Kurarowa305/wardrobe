export const HOME_STRINGS = {
  actions: {
    addRecord: "+ その他から記録",
    refresh: "再読み込み",
    retryWeather: "天気を再取得",
    retryRecommendations: "おすすめを再取得",
    viewTemplates: "テンプレート一覧へ",
  },
  labels: {
    weather: "今日の天気",
    weatherConditions: {
      clear: "晴れ",
      partlyCloudy: "晴れ時々曇り",
      cloudy: "曇り",
      fog: "霧",
      rain: "雨",
      snow: "雪",
      thunder: "雷雨",
      unknown: "天気不明",
    },
    recommendationMode: "推薦モード",
    recommendations: "おすすめテンプレート",
    thumbnail: "テンプレート構成服のサムネイル",
    modes: [
      ["auto", "自動"],
      ["spring", "春"],
      ["summer", "夏"],
      ["autumn", "秋"],
      ["winter", "冬"],
    ],
    temperatureRange: (max: string, min: string) => `最高 ${max} / 最低 ${min}`,
  },
  messages: {
    regionFailed: "地域を取得できませんでした。",
    weatherLoading: "天気を取得中",
    weatherFailed:
      "天気を取得できませんでした。季節を選んでおすすめを表示できます。",
    weatherRegionRequired:
      "地域を設定すると今日の天気と自動のおすすめを表示できます。",
    recommendationsLoading: "おすすめを取得中",
    recommendationsFailed: "おすすめの取得に失敗しました。",
    recordedRecommendationsFailed:
      "記録しました。おすすめの更新に失敗しました。",
    regionRequired: "地域を設定するか、季節を選んでください。",
    weatherRequired:
      "自動判定に必要な天気情報がありません。季節を選んでください。",
    recommendationsEmpty: "おすすめできるテンプレートがありません。",
    recommendationsShort: (count: number) =>
      `おすすめは${count}件です。別の季節を選ぶか、テンプレートを追加できます。`,
  },
  dialogs: {
    region: {
      title: "地域を設定",
      actions: {
        search: "検索",
        clear: "地域設定を解除",
        save: "この地域に設定",
        saving: "設定中…",
      },
      labels: { query: "市区町村名", results: "検索結果" },
      messages: {
        searching: "地域を検索中",
        empty: "該当する地域がありません。",
        hasMore: "候補がほかにもあります。地域名を詳しく入力してください。",
        invalidQuery: "地域名を1〜64文字で入力してください。",
        searchFailed: "地域の検索に失敗しました。もう一度検索してください。",
        saveFailed:
          "地域の保存に失敗しました。選択内容を確認して再度設定してください。",
        latestFailed:
          "現在の地域を確認できません。閉じて再読み込みしてください。",
        datasetChanged:
          "地域データが更新されました。もう一度検索して選択してください。",
        unknownRegion:
          "選択した地域が見つかりません。もう一度検索して地域を選び直してください。",
        regionChanged: (label?: string) =>
          `地域が変更されました（現在: ${label ?? "未設定"}）。選択を確認してもう一度設定してください。`,
      },
    },
    sources: {
      title: "天気・地域情報の出典",
      labels: {
        trigger: "天気情報の出典（Open-Meteo）",
        regionProvider: "地域データ: デジタル庁",
        regionDataset: "アドレス・ベース・レジストリ",
        regionTerms: "利用規約",
        regionLicense: "PDL1.0",
        weatherData: "天気データ:",
        weatherProvider: "Open-Meteo",
        weatherLicense: "CC BY 4.0",
      },
      messages: {
        regionProcessing:
          "全国市区町村マスター・位置参照拡張等をwardrobeが結合・検索用に加工しています。",
        forecast: "当日のモデル予報を使用しています。",
        weatherProcessing:
          "wardrobeによる加工: 市区町村の代表座標で予報を取得し、気温の表示を丸め、体感温度から独自指数とおすすめテンプレートを判定しています。最高実気温を代用する場合があります。提供元の公式服装指数ではありません。",
      },
    },
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
} as const;
