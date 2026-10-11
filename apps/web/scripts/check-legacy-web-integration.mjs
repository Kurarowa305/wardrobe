import assert from "node:assert/strict";
import {
  dom,
  screen,
  fireEvent,
  waitFor,
  mount,
  load,
  act,
} from "./web-integration-harness.mjs";
const RootPage = load("app/page").default;
const HomePage = load("app/home/page").default;
const { RecordByTemplateScreen } = load(
  "components/app/screens/RecordByTemplateScreen",
);
const { RecordByCombinationScreen } = load(
  "components/app/screens/RecordByCombinationScreen",
);
const { HistoriesTabScreen } = load(
  "components/app/screens/HistoriesTabScreen",
);
const { HistoryDetailScreen } = load(
  "components/app/screens/HistoryDetailScreen",
);
const { jstDate } = load("features/home/controller");
const storageKey = "wardrobe:last-wardrobe-id";
let status = 200;
let rootBarrier = null;
const requests = [];
const writes = [];
const clothes = [
  {
    clothingId: "cl_top",
    name: "写真あり",
    genre: "tops",
    imageKey: "wardrobe/夏 服.jpg",
    tagIds: [],
    status: "ACTIVE",
    wearCount: 2,
    lastWornAt: 0,
  },
  {
    clothingId: "cl_bottom",
    name: "写真なし",
    genre: "bottoms",
    imageKey: null,
    tagIds: [],
    status: "DELETED",
    wearCount: 1,
    lastWornAt: 0,
  },
];
const template = {
  templateId: "tp_test",
  name: "既存テンプレート",
  tagIds: [],
  clothingItems: clothes.map((item) => ({ ...item, status: "ACTIVE" })),
};
globalThis.fetch = async (url, options = {}) => {
  const u = new URL(url, "http://localhost");
  requests.push(u);
  if (options.method === "POST") {
    assert(u.pathname.endsWith("/histories"));
    writes.push({
      body: JSON.parse(options.body),
      key: new Headers(options.headers).get("Idempotency-Key"),
    });
    return Response.json({ historyId: `hi_${writes.length}` });
  }
  if (
    u.pathname.endsWith("/templates") &&
    !u.pathname.includes("/recommendations/")
  )
    return Response.json({ items: [template], nextCursor: null });
  if (u.pathname.endsWith("/clothing"))
    return Response.json({
      items: clothes.filter(
        (c) => c.status === "ACTIVE" && c.genre === u.searchParams.get("genre"),
      ),
      nextCursor: null,
    });
  if (u.pathname.endsWith("/histories/hi_test"))
    return Response.json({
      date: "20261011",
      templateName: template.name,
      template: {
        templateId: template.templateId,
        name: template.name,
        wearCount: 4,
        lastWornAt: 0,
      },
      clothingItems: clothes,
    });
  if (u.pathname.endsWith("/histories"))
    return Response.json({
      items: [
        {
          historyId: "hi_test",
          date: "20261011",
          name: template.name,
          clothingItems: clothes,
        },
      ],
      nextCursor: null,
    });
  if (u.pathname.endsWith("/region"))
    return Response.json({ revision: 0, region: null });
  const context = {
    wardrobeId: "wd_query",
    regionRevision: 0,
    targetDate: u.searchParams.get("date"),
  };
  if (u.pathname.endsWith("/weather"))
    return Response.json({
      ...context,
      status: "region_required",
      region: null,
    });
  if (u.pathname.endsWith("/recommendations/templates"))
    return Response.json({
      ...context,
      mode: u.searchParams.get("mode"),
      basis: "none",
      status: "region_required",
      items: [],
    });
  assert.match(u.pathname, /\/wardrobes\/wd_[a-z]+$/);
  if (rootBarrier) await rootBarrier;
  return Response.json(
    status === 200
      ? { name: "既存ワードローブ" }
      : { code: "ERROR", message: "unavailable" },
    { status },
  );
};
// Installed PWA's / entry restores only a valid saved ID. Transient failures retain it; 404 clears it.
for (const scenario of [
  { saved: null, status: 200, expected: "/wardrobes/new" },
  { saved: "invalid", status: 200, expected: "/wardrobes/new" },
  { saved: "wd_saved", status: 200, expected: "/home?wardrobeId=wd_saved" },
  { saved: "wd_saved", status: 503, expected: "/home?wardrobeId=wd_saved" },
  { saved: "wd_saved", status: 404, expected: "/wardrobes/new" },
]) {
  dom.window.localStorage.clear();
  if (scenario.saved)
    dom.window.localStorage.setItem(storageKey, scenario.saved);
  status = scenario.status;
  const view = mount(RootPage);
  await waitFor(() =>
    assert.deepEqual(view.navigation, [["replace", scenario.expected]]),
  );
  if (status === 404)
    assert.equal(dom.window.localStorage.getItem(storageKey), null);
  if (status === 503)
    assert.equal(dom.window.localStorage.getItem(storageKey), "wd_saved");
  await view.dispose();
}
status = 200;
dom.window.localStorage.setItem(storageKey, "wd_saved");
const strictStartup = mount(RootPage, {}, { strict: true });
await waitFor(() =>
  assert.deepEqual(strictStartup.navigation, [
    ["replace", "/home?wardrobeId=wd_saved"],
  ]),
);
await strictStartup.dispose();
let releaseRoot;
rootBarrier = new Promise((resolve) => {
  releaseRoot = resolve;
});
const unmountedStartup = mount(RootPage);
await unmountedStartup.dispose();
await act(async () => {
  releaseRoot();
  await new Promise((resolve) => setTimeout(resolve, 0));
});
assert.deepEqual(
  unmountedStartup.navigation,
  [],
  "late startup response cannot navigate after unmount",
);
rootBarrier = null;
let view = mount(HomePage, {}, { search: "wardrobeId=wd_query&mode=winter" });
await screen.findByText("地域を設定するか、季節を選んでください。");
assert.equal(dom.window.localStorage.getItem(storageKey), "wd_query");
assert.equal(
  screen.getByRole("button", { name: "自動" }).getAttribute("aria-pressed"),
  "true",
  "mode is not restored from URL or storage",
);
assert(requests.some((u) => u.pathname.endsWith("/wardrobes/wd_query")));
assert.equal(
  view.navigation.length,
  0,
  "explicit query ID takes priority over saved ID",
);
await view.dispose();
view = mount(HomePage, {}, { search: "wardrobeId=invalid" });
await waitFor(() =>
  assert.deepEqual(view.navigation, [["replace", "/wardrobes/new"]]),
);
await view.dispose();

view = mount(RecordByTemplateScreen, { wardrobeId: "wd_test" });
const radio = await screen.findByRole("radio", { name: /既存テンプレート/ });
assert.equal(screen.getByLabelText("日付").value, jstDate());
assert.equal(
  screen.getByRole("img").getAttribute("src"),
  "/images/wardrobe/%E5%A4%8F%20%E6%9C%8D.jpg",
);
assert(screen.getByText("no image"));
fireEvent.click(radio);
fireEvent.change(screen.getByLabelText("日付"), {
  target: { value: "2030-07-25" },
});
fireEvent.click(screen.getByRole("button", { name: "記録", exact: true }));
await waitFor(() => assert.equal(view.navigation.length, 1));
assert.deepEqual(
  writes[0],
  { body: { date: "20300725", templateId: "tp_test" }, key: null },
  "legacy template route retains request contract",
);
assert.match(
  view.navigation[0][1],
  /^\/home\?wardrobeId=wd_test&toast=history-created$/,
);
await view.dispose();
view = mount(RecordByCombinationScreen, { wardrobeId: "wd_test" });
const checkbox = await screen.findByRole("checkbox", { name: /写真あり/ });
assert.equal(screen.getByLabelText("日付").value, jstDate());
fireEvent.click(checkbox);
fireEvent.change(screen.getByLabelText("日付"), {
  target: { value: "2024-01-02" },
});
fireEvent.click(screen.getByRole("button", { name: "記録", exact: true }));
await waitFor(() => assert.equal(view.navigation.length, 1));
assert.deepEqual(writes[1], {
  body: { date: "20240102", clothingIds: ["cl_top"] },
  key: null,
});
await view.dispose();

view = mount(HistoriesTabScreen, { wardrobeId: "wd_test" });
const history = await screen.findByRole("link", { name: /既存テンプレート/ });
assert.equal(
  history.getAttribute("href"),
  "/histories/detail?wardrobeId=wd_test&historyId=hi_test&from=histories",
);
assert.equal(
  screen.getByRole("img").getAttribute("src"),
  "/images/wardrobe/%E5%A4%8F%20%E6%9C%8D.jpg",
);
assert(screen.getByText("no image"));
await view.dispose();
view = mount(
  HistoryDetailScreen,
  { wardrobeId: "wd_test", historyId: "hi_test" },
  { search: "wardrobeId=wd_test&historyId=hi_test&from=histories" },
);
await screen.findByText("既存テンプレート");
assert.equal(
  screen.getByRole("img", { name: "写真ありの画像" }).getAttribute("src"),
  "/images/wardrobe/%E5%A4%8F%20%E6%9C%8D.jpg",
);
assert(screen.getByText("no image"));
assert(screen.getByText(/削除済み/));
assert(screen.getByText("着た回数: 4"));
await view.dispose();
dom.window.close();
console.log(
  "PASS legacy web integration: PWA StrictMode restore/unmount/query IDs, transient/404 startup, JST/future legacy template and combination POSTs, history list/detail navigation, image URLs/fallback/deleted status",
);
