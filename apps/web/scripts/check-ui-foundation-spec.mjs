import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;
const SCREEN_FILES = [
  "src/components/app/screens/WardrobeCreateScreen.tsx",
  "src/components/app/screens/HomeTabScreen.tsx",
  "src/components/app/screens/HistoriesTabScreen.tsx",
  "src/components/app/screens/TemplatesTabScreen.tsx",
  "src/components/app/screens/ClothingsTabScreen.tsx",
  "src/components/app/screens/RecordMethodScreen.tsx",
  "src/components/app/screens/RecordByTemplateScreen.tsx",
  "src/components/app/screens/RecordByCombinationScreen.tsx",
  "src/components/app/screens/TemplateCreateScreen.tsx",
  "src/components/app/screens/TemplateDetailScreen.tsx",
  "src/components/app/screens/TemplateEditScreen.tsx",
  "src/components/app/screens/ClothingCreateScreen.tsx",
  "src/components/app/screens/ClothingDetailScreen.tsx",
  "src/components/app/screens/ClothingEditScreen.tsx",
  "src/components/app/screens/HistoryDetailScreen.tsx",
];

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function includes(relPath, expected) {
  return read(relPath).includes(expected);
}

function noIncludes(relPath, unexpected) {
  return !read(relPath).includes(unexpected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "UF-01",
  "shadcn/ui 基盤ファイル（Button/Input/Toast）が存在する",
  [
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/toast.tsx",
    "src/components/ui/toaster.tsx",
    "src/components/ui/use-toast.ts",
    "src/lib/utils.ts",
  ].every((file) => exists(file)),
  "必要な ui 基盤ファイルが不足しています",
);

check(
  "UF-02",
  "RootLayout に Toaster が組み込まれている",
  includes("src/app/layout.tsx", 'import { Toaster } from "@/components/ui/toaster";') &&
    includes("src/app/layout.tsx", "<Toaster />"),
  "layout.tsx で Toaster の import または描画が不足しています",
);

check(
  "UF-03",
  "ワードローブ作成画面で Button と Input を利用している",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'import { Input } from "@/components/ui/input";') &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "<Input") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "<Button"),
  "WardrobeCreateScreen.tsx で Button/Input の利用が確認できません",
);

check(
  "UF-04",
  "入力未設定時に destructive トーストでエラー通知する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "if (name.trim().length === 0)") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'variant: "destructive"') &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "WARDROBE_STRINGS.create.errors.nameRequired"),
  "入力エラー時のトースト通知実装が不足しています",
);

check(
  "UF-05",
  "作成成功時はホーム遷移に作成完了クエリを付与する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "ROUTES.home(DEMO_IDS.wardrobe)") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "?created=1"),
  "WardrobeCreateScreen.tsx で作成完了クエリ付き遷移が設定されていません",
);

check(
  "UF-06",
  "ワードローブ文言に入力エラー文言が定義されている",
  includes("src/features/wardrobe/strings.ts", "nameRequired") &&
    includes("src/features/wardrobe/strings.ts", "ワードローブ名を入力してください。"),
  "features/wardrobe/strings.ts に入力エラー文言が見つかりません",
);

check(
  "UF-07",
  "ToastViewport が画面最下部中央に配置される",
  includes("src/components/ui/toast.tsx", "fixed bottom-4 left-1/2") &&
    includes("src/components/ui/toast.tsx", "-translate-x-1/2") &&
    includes("src/components/ui/toast.tsx", "slide-in-from-bottom-full"),
  "toast.tsx の Viewport 配置またはアニメーションが下部中央仕様と一致しません",
);

check(
  "UF-08",
  "ホーム画面で created クエリをクライアント判定し、表示後にURLを正規化する",
  noIncludes("src/app/wardrobes/[wardrobeId]/(tabs)/home/page.tsx", "searchParams") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "new URLSearchParams(window.location.search)") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", 'searchParams.get("created") !== "1"') &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "HOME_STRINGS.toasts.wardrobeCreated") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", 'window.history.replaceState(window.history.state, "", ROUTES.home(wardrobeId));'),
  "作成完了トーストの表示連携（home/page.tsx / HomeTabScreen.tsx）が不足しています",
);

check(
  "UF-09",
  "スクリーン実装は全画面で ScreenCard を使わない直接描画に統一される",
  SCREEN_FILES.every((file) => {
    const source = read(file);
    const directRenderingGuard = file.endsWith("WardrobeCreateScreen.tsx")
      ? source.includes("showHeader={false}") && source.includes("WARDROBE_STRINGS.create.heroTitle") && source.includes("<form")
      : file.endsWith("HistoriesTabScreen.tsx")
        ? source.includes("HISTORY_STRINGS.list.messages.loading")
        : file.endsWith("ClothingsTabScreen.tsx")
          ? source.includes("CLOTHING_STRINGS.list.actions.add")
          : file.endsWith("TemplatesTabScreen.tsx")
            ? source.includes("TEMPLATE_STRINGS.list.actions.add")
            : file.endsWith("HomeTabScreen.tsx")
              ? source.includes("HOME_STRINGS.sections.recentWeekHistories") && source.includes("useRecentHistories")
              : file.endsWith("RecordMethodScreen.tsx")
                ? source.includes("RECORD_STRINGS.method.descriptions.byTemplate") &&
                  source.includes("RECORD_STRINGS.method.descriptions.byCombination")
                : file.endsWith("RecordByCombinationScreen.tsx")
                  ? source.includes("<form") && source.includes("RECORD_STRINGS.byCombination.labels.clothing")
                  : file.endsWith("RecordByTemplateScreen.tsx")
                    ? source.includes("<form") && source.includes('className="grid gap-4"')
                    : file.endsWith("TemplateCreateScreen.tsx")
                      ? source.includes("createElement(TemplateForm")
                      : file.endsWith("TemplateDetailScreen.tsx")
                        ? source.includes("TEMPLATE_STRINGS.detail.labels.clothingItems") && source.includes('className="grid gap-4"')
                        : file.endsWith("TemplateEditScreen.tsx")
                          ? source.includes("createElement(TemplateForm")
                          : file.endsWith("ClothingCreateScreen.tsx")
                            ? source.includes("CLOTHING_STRINGS.create.actions.submit") && source.includes('className="grid gap-4"')
                            : file.endsWith("ClothingDetailScreen.tsx")
                              ? source.includes("CLOTHING_STRINGS.detail.labels.wearCount") && source.includes('className="grid gap-4"')
                              : file.endsWith("ClothingEditScreen.tsx")
                                ? source.includes("CLOTHING_STRINGS.edit.actions.submit") && source.includes('className="grid gap-4"')
                                : source.includes("HISTORY_STRINGS.detail.labels.clothingItems") && source.includes('className="grid gap-4"');

    return !source.includes("ScreenCard") && !source.includes("ScreenTextCard") && directRenderingGuard;
  }),
  "スクリーンの直接描画構成が期待値と一致しません",
);

check(
  "UF-10",
  "スクリーン実装から旧 screen-* クラス依存が除去されている",
  SCREEN_FILES.every((file) => {
    const source = read(file);
    return (
      !source.includes("screen-panel") &&
      !source.includes("screen-link-list") &&
      !source.includes("screen-link")
    );
  }),
  "screen-panel / screen-link-list / screen-link が残っているスクリーンがあります",
);

check(
  "UF-11",
  "指定された記録/追加アクションは ScreenLinkButton ではなく Button 基盤を利用している",
  includes("src/components/app/screens/HomeTabScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "HOME_STRINGS.actions.addRecord") &&
    includes("src/components/app/screens/RecordMethodScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/RecordMethodScreen.tsx", "RECORD_STRINGS.method.actions.byTemplate") &&
    includes("src/components/app/screens/RecordMethodScreen.tsx", "RECORD_STRINGS.method.actions.byCombination") &&
    noIncludes("src/components/app/screens/RecordMethodScreen.tsx", "ScreenLinkButton") &&
    includes("src/components/app/screens/RecordByTemplateScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/RecordByTemplateScreen.tsx", "RECORD_STRINGS.byTemplate.actions.submit") &&
    noIncludes("src/components/app/screens/RecordByTemplateScreen.tsx", "ScreenLinkButton") &&
    includes("src/components/app/screens/RecordByCombinationScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/RecordByCombinationScreen.tsx", "RECORD_STRINGS.byCombination.actions.submit") &&
    noIncludes("src/components/app/screens/RecordByCombinationScreen.tsx", "ScreenLinkButton") &&
    includes("src/components/app/screens/TemplatesTabScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/TemplatesTabScreen.tsx", "TEMPLATE_STRINGS.list.actions.add") &&
    includes("src/components/app/screens/TemplateCreateScreen.tsx", 'import { TemplateForm } from "./TemplateForm";') &&
    includes("src/components/app/screens/TemplateCreateScreen.tsx", "createElement(TemplateForm") &&
    noIncludes("src/components/app/screens/TemplateCreateScreen.tsx", "ScreenLinkButton") &&
    includes("src/components/app/screens/ClothingsTabScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/ClothingsTabScreen.tsx", "CLOTHING_STRINGS.list.actions.add") &&
    includes("src/components/app/screens/ClothingCreateScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/ClothingCreateScreen.tsx", "CLOTHING_STRINGS.create.actions.submit") &&
    noIncludes("src/components/app/screens/ClothingCreateScreen.tsx", "ScreenLinkButton"),
  "指定アクションの Button 基盤置換が未完了です",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
