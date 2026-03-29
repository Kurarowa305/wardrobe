import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const noIncludes = (relativePath, text) => !read(relativePath).includes(text);

const screenPath = "src/components/app/screens/WardrobeCreateScreen.tsx";
const stringsPath = "src/features/wardrobe/strings.ts";

const checks = [
  {
    id: "WCV-01",
    name: "入力値を trim した結果で送信可否を判定している",
    ok:
      includes(screenPath, "const trimmedName = name.trim();") &&
      includes(screenPath, "const isSubmitDisabled = trimmedName.length === 0 || createWardrobeMutation.isPending;"),
    detail: "trim 済みの入力値で送信可否を判定する実装が不足しています",
  },
  {
    id: "WCV-02",
    name: "ワードローブ名未入力時は作成ボタンを非活性にしている",
    ok: includes(screenPath, '<Button type="submit" className="w-full" disabled={isSubmitDisabled}>'),
    detail: "作成ボタンの disabled 制御が不足しています",
  },
  {
    id: "WCV-03",
    name: "未入力時のトースト導線を削除している",
    ok:
      noIncludes(screenPath, 'import { useToast } from "@/components/ui/use-toast";') &&
      noIncludes(screenPath, "toast(") &&
      noIncludes(screenPath, 'variant: "destructive"') &&
      noIncludes(screenPath, "WARDROBE_STRINGS.create.errors"),
    detail: "ワードローブ作成画面に入力エラートーストの実装が残っています",
  },
  {
    id: "WCV-04",
    name: "文言定義から未使用の入力エラー文言を削除している",
    ok: noIncludes(stringsPath, "errors") && noIncludes(stringsPath, "nameRequired"),
    detail: "ワードローブ文言定義に未使用の入力エラー文言が残っています",
  },
  {
    id: "WCV-05",
    name: "入力済みの場合のみワードローブ作成APIを実行し、返却IDでホームへ遷移する",
    ok:
      includes(screenPath, "if (isSubmitDisabled) {") &&
      includes(screenPath, "const created = await createWardrobeMutation.mutateAsync({") &&
      includes(screenPath, "name: trimmedName,") &&
      includes(screenPath, "appendOperationToast(ROUTES.home(created.wardrobeId), OPERATION_TOAST_IDS.wardrobeCreated)") &&
      includes(screenPath, "router.push(appendOperationToast(ROUTES.home(created.wardrobeId), OPERATION_TOAST_IDS.wardrobeCreated));"),
    detail: "作成API呼び出しまたは返却 wardrobeId を使った遷移が不足しています",
  },
];

let hasFailure = false;
for (const check of checks) {
  if (check.ok) {
    console.log(`PASS ${check.id}: ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`FAIL ${check.id}: ${check.name}`);
    console.error(`  ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
