import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const target = path.join(repoRoot, "src/components/ui/tab-bar-icon.tsx");
const source = fs.readFileSync(target, "utf8");

const checks = [
  {
    name: "SVGベース実装が指定どおりの線スタイルを適用する",
    patterns: [
      'stroke={color}',
      'strokeWidth="1.5"',
      'strokeLinecap="round"',
      'strokeLinejoin="round"',
      'fill="none"',
    ],
  },
  {
    name: "ホームアイコンが指定SVGパスを持つ",
    patterns: ['<path d="M3 10L12 3l9 7" />', '<path d="M5 10v11h5v-6h4v6h5V10" />'],
  },
  {
    name: "履歴アイコンが指定SVGパスを持つ",
    patterns: [
      '<circle cx="12" cy="12" r="8" />',
      '<path d="M12 7v5l3 3" />',
    ],
  },
  {
    name: "テンプレートアイコンが指定SVGパスを持つ",
    patterns: [
      '<path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />',
      '<rect x="4" y="8" width="12" height="12" rx="2" />',
    ],
  },
  {
    name: "服アイコンが指定SVGパスを持つ",
    patterns: ['<path d="M9 3q3 3 6 0l4 1 2 5-4 2v10H7V11l-4-2 2-5 4-1z" />'],
  },
];

let hasFailure = false;
for (const check of checks) {
  const ok = check.patterns.every((pattern) => source.includes(pattern));
  if (ok) {
    console.log(`✅ ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`❌ ${check.name}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
