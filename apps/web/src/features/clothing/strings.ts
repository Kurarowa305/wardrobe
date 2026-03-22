export const CLOTHING_STRINGS = {
  list: {
    title: "服",
    actions: {
      add: "＋ 服を追加",
    },
    messages: {
      loading: "読み込み中...",
      empty: "服がまだ登録されていません。",
      error: "服一覧の読み込みに失敗しました。",
      sectionEmpty: "このジャンルの服はまだ登録されていません。",
      limitNotice: "服の登録上限は100件です。一覧はジャンルごとに最大100件まで取得します。",
    },
  },
  common: {
    collapse: "折りたたむ",
    expand: "展開",
  },
  form: {
    labels: {
      genre: "服のジャンル",
    },
  },
  create: {
    title: "服の追加",
    labels: {
      imageFile: "画像ファイル",
      name: "服の名前",
      genre: "服のジャンル",
    },
    placeholders: {
      name: "例: 白シャツ",
    },
    actions: {
      submit: "追加",
      clearImage: "画像をクリア",
      retryUpload: "アップロードを再試行",
    },
    messages: {
      nameRequired: "服の名前を入力してください。",
      genreRequired: "服のジャンルを選択してください。",
      submitting: "追加中...",
      submitSuccess: "服を追加しました",
      submitError: "服の追加に失敗しました。",
      noPreview: "画像を選択するとここにプレビューが表示されます。",
      previewAlt: "選択した画像のプレビュー",
      uploadingImage: "画像アップロード中...",
      uploadError: "画像アップロードに失敗しました。再試行してください。",
    },
  },
  edit: {
    title: "服の編集",
    labels: {
      imageFile: "画像ファイル",
      name: "服の名前",
      genre: "服のジャンル",
    },
    placeholders: {
      name: "例: 白シャツ",
    },
    actions: {
      submit: "保存",
      clearImage: "画像をクリア",
      retryUpload: "アップロードを再試行",
    },
    messages: {
      loading: "読み込み中...",
      loadError: "服編集画面の読み込みに失敗しました。",
      nameRequired: "服の名前を入力してください。",
      genreRequired: "服のジャンルを選択してください。",
      submitting: "保存中...",
      submitSuccess: "服を更新しました",
      submitError: "服の更新に失敗しました。",
      noPreview: "画像を選択するとここにプレビューが表示されます。",
      previewAlt: "選択した画像のプレビュー",
      uploadingImage: "画像アップロード中...",
      uploadError: "画像アップロードに失敗しました。再試行してください。",
    },
  },
  detail: {
    title: "服の詳細",
    labels: {
      wearCount: "着た回数",
      lastWornAt: "最後に着た日",
      genre: "ジャンル",
    },
    menu: {
      edit: "編集",
      delete: "削除",
    },
    messages: {
      loading: "読み込み中...",
      error: "服詳細の読み込みに失敗しました。",
      notFound: "服が見つかりませんでした。",
      deleted: "削除済み",
      deleteSuccess: "服を削除しました",
      deleteError: "服の削除に失敗しました。",
      neverWorn: "未着用",
    },
  },
} as const;
