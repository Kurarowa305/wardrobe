import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/home?wardrobeId=wd_test",
});
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  IntersectionObserver: undefined,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
const require = createRequire(import.meta.url);
const React = require("react");
const {
  render,
  fireEvent,
  screen,
  waitFor,
  cleanup,
  act,
} = require("@testing-library/react");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
const {
  AppRouterContext,
} = require("next/dist/shared/lib/app-router-context.shared-runtime");
const { HomeTabScreen } = load("components/app/screens/HomeTabScreen");
const requests = [];
let release;
let selected;
globalThis.fetch = async (url, options) => {
  const u = new URL(url, "http://localhost");
  requests.push(u.pathname);
  if (u.pathname.endsWith("/region"))
    return Response.json({ revision: 0, region: null });
  const context = {
    wardrobeId: "wd_test",
    regionRevision: 0,
    targetDate: u.searchParams.get("date"),
  };
  if (u.pathname.endsWith("/weather"))
    return Response.json({
      ...context,
      status: "region_required",
      region: null,
    });
  if (u.pathname.endsWith("/recommendations/templates")) {
    const mode = u.searchParams.get("mode");
    if (mode === "winter") await new Promise((r) => (release = r));
    return Response.json({
      ...context,
      mode,
      status:
        mode === "auto"
          ? "region_required"
          : mode === "spring"
            ? "empty"
            : "ready",
      basis: mode === "auto" ? "none" : "manual",
      items:
        mode === "auto" || mode === "spring"
          ? []
          : [
              {
                templateId: "tp_test",
                name: "長いテンプレート名",
                revision: 3,
                tagIds: [],
                clothingItems: Array.from({ length: 20 }, (_, i) => ({
                  clothingId: `cl_${i}`,
                  imageKey: null,
                  status: "ACTIVE",
                })),
              },
            ],
    });
  }
  return Response.json({ name: "テストのワードローブ" });
};
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity } },
});
render(
  React.createElement(
    QueryClientProvider,
    { client },
    React.createElement(
      AppRouterContext.Provider,
      { value: { push() {}, prefetch() {} } },
      React.createElement(HomeTabScreen, {
        wardrobeId: "wd_test",
        onRecordTemplate: (item) => (selected = item),
      }),
    ),
  ),
);
await screen.findByText("地域を設定するか、季節を選んでください。");
assert.equal(
  screen.getByRole("button", { name: "自動" }).getAttribute("aria-pressed"),
  "true",
);
assert.equal(
  screen.getAllByRole("group", { name: "推薦モード" })[0].children.length,
  5,
);
assert.equal(screen.queryByText("直近1週間の履歴"), null);
assert(
  !requests.some(
    (path) =>
      path.includes("/histories") || path.includes("/recommendations/clothing"),
  ),
  "home never fetches old recommendations or histories",
);
fireEvent.click(screen.getByRole("button", { name: "夏" }));
const card = await screen.findByRole("button", { name: /長いテンプレート名/ });
assert(card.textContent.includes("+16"), "four thumbnails and remaining count");
fireEvent.click(card);
assert.equal(
  selected.revision,
  3,
  "record seam preserves confirmation revision",
);
const other = screen.getByRole("link", { name: "+ その他から記録" });
assert(
  card.compareDocumentPosition(other) &
    dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
  "other-record action after cards",
);
assert(other.className.includes("bg-white"));
assert.equal(
  screen.getByRole("link", { name: "履歴" }).getAttribute("href"),
  "/histories?wardrobeId=wd_test",
);
fireEvent.click(screen.getByRole("button", { name: "冬" }));
await screen.findByText("おすすめを取得中");
assert.equal(
  screen.queryByRole("button", { name: /長いテンプレート名/ }),
  null,
  "switch hides old cards",
);
await act(async () => {
  release();
});
await screen.findByRole("button", { name: /長いテンプレート名/ });
fireEvent.click(screen.getByRole("button", { name: "春" }));
await screen.findByText("おすすめできるテンプレートがありません。");
assert(screen.getByRole("link", { name: "テンプレート一覧へ" }));
const beforeResume = requests.filter((path) => path.endsWith("/region")).length;
Object.defineProperty(document, "visibilityState", {
  value: "hidden",
  configurable: true,
});
fireEvent(document, new dom.window.Event("visibilitychange"));
Object.defineProperty(document, "visibilityState", {
  value: "visible",
  configurable: true,
});
fireEvent(document, new dom.window.Event("visibilitychange"));
await screen.findByText("地域を設定するか、季節を選んでください。");
assert.equal(
  screen.getByRole("button", { name: "自動" }).getAttribute("aria-pressed"),
  "true",
  "background resume resets manual mode",
);
assert.equal(
  requests.filter((path) => path.endsWith("/region")).length,
  beforeResume + 1,
  "resume rereads saved region",
);
cleanup();
await new Promise((r) => setTimeout(r, 0));
client.clear();
dom.window.close();
console.log(
  "PASS home screen: mode order, no obsolete fetches, loading hides cards, empty/add, 20 clothes, callback revision, trailing white record action, history tab",
);
