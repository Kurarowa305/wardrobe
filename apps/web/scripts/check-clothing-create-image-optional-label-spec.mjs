import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve(process.cwd(), 'src/features/clothing/strings.ts');
const source = readFileSync(target, 'utf8');

const checks = [];
function check(id, description, condition, details) {
  checks.push({ id, description, condition, details });
}

check(
  'COL-01',
  '服追加画面の画像ラベルが任意表記になっている',
  source.includes('create: {') && source.includes('imageFile: "画像ファイル（任意）"'),
  'CLOTHING_STRINGS.create.labels.imageFile が「画像ファイル（任意）」ではありません',
);

check(
  'COL-02',
  '服編集画面の画像ラベルは既存文言を維持する',
  source.includes('edit: {') && source.includes('imageFile: "画像ファイル"'),
  'CLOTHING_STRINGS.edit.labels.imageFile の既存文言が変わっています',
);

const failed = checks.filter((item) => !item.condition);
for (const item of checks) {
  console.log(`${item.condition ? '✅' : '❌'} ${item.id}: ${item.description}`);
  if (!item.condition) console.log(`   ${item.details}`);
}

if (failed.length > 0) process.exit(1);
