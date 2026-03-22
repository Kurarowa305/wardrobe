import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const target = path.join(repoRoot, "src/features/clothing/genre.tsx");
const source = fs.readFileSync(target, "utf8");

const checks = [
  {
    name: "トップスアイコンが服タブと同一SVGを持つ",
    patterns: [
      'if (genre === "tops") {',
      '<path d="M9 3q3 3 6 0l4 1 2 5-4 2v10H7V11l-4-2 2-5 4-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />',
    ],
  },
  {
    name: "ボトムスアイコンが長ズボンのSVGを持つ",
    patterns: [
      'if (genre === "bottoms") {',
      '<path d="M8 3.5h8l1 6.5-2.5 1.5-1.5 8H11.5L10 12l-1.5 8H7l-1.5-8L3 10l1-6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />',
    ],
  },
  {
    name: "その他アイコンは既存の人物シルエットを維持する",
    patterns: [
      '<circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />',
      '<path d="M6.5 20v-2.5A3.5 3.5 0 0 1 10 14h4a3.5 3.5 0 0 1 3.5 3.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />',
    ],
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
