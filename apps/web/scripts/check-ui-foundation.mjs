import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(process.cwd());

async function read(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

function assertContains(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label} に '${expected}' が見つかりません`);
  }
}

async function main() {
  const button = await read("src/components/ui/button.tsx");
  assertContains(button, "export function Button", "button.tsx");

  const input = await read("src/components/ui/input.tsx");
  assertContains(input, "export function Input", "input.tsx");

  const toast = await read("src/components/ui/toast.tsx");
  assertContains(toast, "export function ToastProvider", "toast.tsx");
  assertContains(toast, "export function useToast", "toast.tsx");

  const layout = await read("src/app/layout.tsx");
  assertContains(layout, "ToastProvider", "app/layout.tsx");

  const form = await read("src/components/app/screens/WardrobeCreateForm.tsx");
  assertContains(form, "error(\"ワードローブ名を入力してください\")", "WardrobeCreateForm.tsx");

  console.log("UI foundation checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
