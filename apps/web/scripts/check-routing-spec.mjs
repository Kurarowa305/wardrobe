import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const appRoot = path.join(webRoot, "src", "app");
const screenRoot = path.join(webRoot, "src", "components", "app", "screens");

const failures = [];
let checkCount = 0;

const TAB_PAGES = [
  "src/app/wardrobes/[wardrobeId]/(tabs)/home/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(tabs)/histories/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(tabs)/templates/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(tabs)/clothings/page.tsx",
];

const STACK_PAGES = [
  "src/app/wardrobes/[wardrobeId]/(stack)/record/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/record/template/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/record/combination/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/histories/[historyId]/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/templates/new/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/templates/[templateId]/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/templates/[templateId]/edit/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/clothings/new/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/edit/page.tsx",
];

const TAB_SCREENS = [
  "src/components/app/screens/HomeTabScreen.tsx",
  "src/components/app/screens/HistoriesTabScreen.tsx",
  "src/components/app/screens/TemplatesTabScreen.tsx",
  "src/components/app/screens/ClothingsTabScreen.tsx",
];

const STACK_SCREENS = [
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

const CREATE_SCREEN = "src/components/app/screens/WardrobeCreateScreen.tsx";
const HISTORY_DETAIL_SCREEN = "src/components/app/screens/HistoryDetailScreen.tsx";
const HISTORY_ROUTING = "src/features/history/routing.ts";
const CREATE_PAGE = "src/app/wardrobes/new/page.tsx";
const ROOT_PAGE = "src/app/page.tsx";

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function collectFiles(dirPath, out = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function recordResult(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

function check(id, description, fn) {
  try {
    const result = fn();
    const passed = typeof result === "boolean" ? result : result.ok;
    const detail = typeof result === "boolean" ? "" : result.detail;
    recordResult(id, description, passed, detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordResult(id, description, false, `unexpected error: ${message}`);
  }
}

function includes(relPath, expected) {
  return read(relPath).includes(expected);
}

function noIncludes(relPath, unexpected) {
  return !read(relPath).includes(unexpected);
}

function containsAll(relPath, expectedList) {
  const source = read(relPath);
  return expectedList.every((item) => source.includes(item));
}

function readNormalized(relPath) {
  return read(relPath).replace(/\s+/g, " ").trim();
}

function includesAny(relPath, expectedList) {
  const source = read(relPath);
  return expectedList.some((item) => source.includes(item));
}

function findPageFiles() {
  return collectFiles(appRoot)
    .filter((file) => file.endsWith("/page.tsx"))
    .map((file) => path.relative(webRoot, file).replaceAll(path.sep, "/"));
}

const expected15Screens = [CREATE_PAGE, ...TAB_PAGES, ...STACK_PAGES];

check("RT-01", "root route redirects to /wardrobes/new", () => {
  const ok = includes(ROOT_PAGE, "redirect(ROUTES.wardrobeNew);");
  return { ok, detail: `${ROOT_PAGE} must call redirect(ROUTES.wardrobeNew)` };
});

check("RT-02", "wardrobe create page exists at /wardrobes/new", () => {
  const ok = exists(CREATE_PAGE);
  return { ok, detail: `missing file: ${CREATE_PAGE}` };
});

check("RT-03", "legacy top-level routes do not exist", () => {
  const forbidden = [
    "src/app/home/page.tsx",
    "src/app/histories/page.tsx",
    "src/app/templates/page.tsx",
    "src/app/clothings/page.tsx",
    "src/app/record/page.tsx",
    "src/app/(tabs)",
    "src/app/(stack)",
  ];
  const remaining = forbidden.filter((item) => exists(item));
  return {
    ok: remaining.length === 0,
    detail: `legacy paths still exist: ${remaining.join(", ") || "(none)"}`,
  };
});

check("RT-04", "all stack routes under wardrobeId exist", () => {
  const missing = STACK_PAGES.filter((file) => !exists(file));
  return {
    ok: missing.length === 0,
    detail: `missing stack pages: ${missing.join(", ") || "(none)"}`,
  };
});

check("RT-05", "all 15 screens are defined", () => {
  const pages = findPageFiles().filter((file) => file !== ROOT_PAGE);
  const missing = expected15Screens.filter((file) => !pages.includes(file));
  const extra = pages.filter((file) => !expected15Screens.includes(file));
  const ok = pages.length === 15 && missing.length === 0 && extra.length === 0;
  return {
    ok,
    detail: `count=${pages.length}, missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`,
  };
});

check("RT-06", "TabBar rendering is limited to tab screens", () => {
  const appLayoutOk = includes(
    "src/components/app/layout/AppLayout.tsx",
    "{tabKey && wardrobeId ? <TabBar activeTab={tabKey} wardrobeId={wardrobeId} /> : null}",
  );
  const tabScreensOk = TAB_SCREENS.every(
    (file) => includes(file, "tabKey:") && includes(file, "wardrobeId"),
  );
  const stackScreensOk = STACK_SCREENS.every((file) => noIncludes(file, "tabKey:"));
  return {
    ok: appLayoutOk && tabScreensOk && stackScreensOk,
    detail:
      "AppLayout tab condition or tab/stack screen props do not match expected tab-only behavior",
  };
});

check("RT-07", "tab transitions keep wardrobeId", () => {
  const ok = containsAll("src/components/app/navigation/TabBar.tsx", [
    "ROUTES.home(wardrobeId)",
    "ROUTES.histories(wardrobeId)",
    "ROUTES.templates(wardrobeId)",
    "ROUTES.clothings(wardrobeId)",
  ]);
  return {
    ok,
    detail: "TabBar must resolve all tab hrefs with wardrobeId",
  };
});

check("RT-08", "tab pages have no back button", () => {
  const invalid = TAB_SCREENS.filter((file) => includes(file, "backHref"));
  return {
    ok: invalid.length === 0,
    detail: `tab screens unexpectedly include backHref: ${invalid.join(", ") || "(none)"}`,
  };
});

check("RT-09", "stack/detail pages have back button", () => {
  const missing = STACK_SCREENS.filter((file) => !includes(file, "backHref"));
  return {
    ok: missing.length === 0,
    detail: `stack screens missing backHref: ${missing.join(", ") || "(none)"}`,
  };
});

check("RT-10", "record method back route is wardrobe home", () => {
  const ok = includesAny("src/components/app/screens/RecordMethodScreen.tsx", [
    "backHref: ROUTES.home(wardrobeId),",
    "backHref={ROUTES.home(wardrobeId)}",
  ]);
  return { ok, detail: "RecordMethodScreen must back to ROUTES.home(wardrobeId)" };
});

check("RT-11", "record detail pages back to record method", () => {
  const files = [
    "src/components/app/screens/RecordByTemplateScreen.tsx",
    "src/components/app/screens/RecordByCombinationScreen.tsx",
  ];
  const invalid = files.filter(
    (file) =>
      !includesAny(file, [
        "backHref: ROUTES.recordMethod(wardrobeId),",
        "backHref={ROUTES.recordMethod(wardrobeId)}",
      ]),
  );
  return {
    ok: invalid.length === 0,
    detail: `record child screens with wrong back route: ${invalid.join(", ") || "(none)"}`,
  };
});

check("RT-12", "template create/detail/edit back routes follow spec", () => {
  const checks = [
    includes(
      "src/components/app/screens/TemplateCreateScreen.tsx",
      "backHref: ROUTES.templates(wardrobeId),",
    ),
    includes(
      "src/components/app/screens/TemplateDetailScreen.tsx",
      "backHref: ROUTES.templates(wardrobeId),",
    ),
    includes(
      "src/components/app/screens/TemplateEditScreen.tsx",
      "backHref: ROUTES.templateDetail(wardrobeId, templateId),",
    ),
  ];
  return {
    ok: checks.every(Boolean),
    detail: "template screen backHref definitions do not match expected flows",
  };
});

check("RT-13", "clothing create/detail/edit back routes follow spec", () => {
  const checks = [
    includes(
      "src/components/app/screens/ClothingCreateScreen.tsx",
      "backHref: ROUTES.clothings(wardrobeId),",
    ),
    includes(
      "src/components/app/screens/ClothingDetailScreen.tsx",
      "backHref: ROUTES.clothings(wardrobeId),",
    ),
    includes(
      "src/components/app/screens/ClothingEditScreen.tsx",
      "backHref: ROUTES.clothingDetail(wardrobeId, clothingId),",
    ),
  ];
  return {
    ok: checks.every(Boolean),
    detail: "clothing screen backHref definitions do not match expected flows",
  };
});

check("RT-14", "history detail from=home returns to home", () => {
  const ok = includes(HISTORY_ROUTING, 'from === "home" ? ROUTES.home(wardrobeId)');
  return { ok, detail: "history routing resolver must branch to home when from=home" };
});

check("RT-15", "history detail from=histories returns to histories", () => {
  const ok = includes(HISTORY_ROUTING, "ROUTES.histories(wardrobeId)");
  return { ok, detail: "history routing resolver must route to histories when from!=home" };
});

check("RT-16", "history detail uses histories as fallback for invalid from", () => {
  const ok =
    includes(
      HISTORY_ROUTING,
      'return from === "home" ? ROUTES.home(wardrobeId) : ROUTES.histories(wardrobeId);',
    ) &&
    includes(HISTORY_DETAIL_SCREEN, 'resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"))');
  return {
    ok,
    detail:
      "history detail must use feature resolver and resolver fallback branch should return histories",
  };
});

check("RT-17", "history detail uses histories when from is omitted", () => {
  const ok = includes(HISTORY_DETAIL_SCREEN, "searchParams.get(\"from\")");
  return {
    ok,
    detail: "from query should be read as optional value and use fallback branch",
  };
});

check("RT-18", "history tab has no direct link to home tab", () => {
  const ok = noIncludes("src/components/app/screens/HistoriesTabScreen.tsx", "ホームタブへ");
  return {
    ok,
    detail: "histories tab should not expose 'ホームタブへ' link",
  };
});

check("RT-19", "all in-wardrobe route calls use wardrobeId as first argument", () => {
  const routeFiles = [
    ...collectFiles(path.join(appRoot, "wardrobes", "[wardrobeId]")),
    ...collectFiles(screenRoot),
  ];
  const files = routeFiles
    .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
    .map((file) => path.relative(webRoot, file).replaceAll(path.sep, "/"))
    .filter((file) => file !== CREATE_SCREEN);

  const pattern =
    /ROUTES\.(home|histories|templates|clothings|recordMethod|recordByTemplate|recordByCombination|templateNew|templateDetail|templateEdit|clothingNew|clothingDetail|clothingEdit|historyDetail)\(\s*(?!wardrobeId\b)/;

  const offenders = [];
  for (const file of files) {
    const source = read(file);
    if (pattern.test(source)) {
      offenders.push(file);
    }
  }

  return {
    ok: offenders.length === 0,
    detail: `route calls without wardrobeId detected in: ${offenders.join(", ") || "(none)"}`,
  };
});

check("RT-20", "create page links to demo wardrobe home", () => {
  const ok = includes(CREATE_SCREEN, "ROUTES.home(DEMO_IDS.wardrobe)");
  return {
    ok,
    detail: "WardrobeCreateScreen should route to demo wardrobe home",
  };
});

check("RT-21", "history detail isolates searchParams access behind Suspense", () => {
  const normalized = readNormalized(HISTORY_DETAIL_SCREEN);
  const searchParamsIndex = normalized.indexOf("const searchParams = useSearchParams();");
  const contentIndex = normalized.indexOf("function HistoryDetailScreenContent(");
  const suspenseIndex = normalized.indexOf("<Suspense");
  const fallbackIndex = normalized.indexOf("fallback={");
  const searchSubtreeIndex = normalized.indexOf("<HistoryDetailScreenSearchParams wardrobeId={wardrobeId} historyId={historyId} />");
  const fallbackContentIndex = normalized.indexOf("<HistoryDetailScreenContent wardrobeId={wardrobeId} historyId={historyId} backHref={ROUTES.histories(wardrobeId)} />");
  const resolvesFromQuery = normalized.includes(
    'const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));',
  );

  return {
    ok:
      searchParamsIndex !== -1 &&
      contentIndex !== -1 &&
      suspenseIndex !== -1 &&
      fallbackIndex !== -1 &&
      searchSubtreeIndex !== -1 &&
      fallbackContentIndex !== -1 &&
      resolvesFromQuery &&
      contentIndex < searchParamsIndex &&
      searchParamsIndex < suspenseIndex &&
      fallbackIndex < searchSubtreeIndex,
    detail:
      "HistoryDetailScreen must read searchParams in a Suspense-wrapped subtree with histories fallback",
  };
});

check("RT-22", "template detail/edit pages generate static params from fixtures and reserved mock ids", () => {
  const pages = [
    "src/app/wardrobes/[wardrobeId]/(stack)/templates/[templateId]/page.tsx",
    "src/app/wardrobes/[wardrobeId]/(stack)/templates/[templateId]/edit/page.tsx",
  ];
  const invalid = pages.filter(
    (file) =>
      !containsAll(file, [
        'import { templateDetailFixtures } from "@/mocks/fixtures/template";',
        'const MOCK_TEMPLATE_ID_PREFIX = "tp_mock_";',
        "const MOCK_TEMPLATE_STATIC_PARAMS_COUNT = 200;",
        "...templateDetailFixtures.map((fixture) => fixture.templateId)",
        "...generateMockStaticTemplateIds(),",
        "wardrobeId: DEMO_IDS.wardrobe,",
        "templateId,",
      ]),
  );
  return {
    ok: invalid.length === 0,
    detail: `template detail/edit generateStaticParams must cover fixture and reserved mock ids: ${invalid.join(", ") || "(none)"}`,
  };
});

if (failures.length > 0) {
  console.error("\nRouting spec checks failed:");
  for (const failure of failures) {
    console.error(failure);
  }
  console.error(`\n${failures.length}/${checkCount} checks failed.`);
  process.exit(1);
}

console.log(`\nAll routing spec checks passed (${checkCount}/${checkCount}).`);
