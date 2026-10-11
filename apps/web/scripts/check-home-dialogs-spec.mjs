import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
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
} = require("@testing-library/react");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
const h = React.createElement;
const { WeatherSources } = load("components/app/home/WeatherSources");
render(h(WeatherSources));
const trigger = screen.getByRole("link", {
  name: "天気情報の出典（Open-Meteo）",
});
assert.equal(trigger.getAttribute("href"), "https://open-meteo.com/");
trigger.focus();
fireEvent.click(trigger);
const dialog = screen.getByRole("dialog", { name: "天気・地域情報の出典" });
assert(dialog.contains(document.activeElement));
assert.equal(
  screen.getByRole("link", { name: "CC BY 4.0" }).getAttribute("href"),
  "https://creativecommons.org/licenses/by/4.0/",
);
const close = screen.getByRole("button", { name: "閉じる" });
close.focus();
fireEvent.keyDown(close, { key: "Tab" });
assert.equal(
  document.activeElement,
  screen.getByRole("link", { name: "Open-Meteo" }),
  "Tab wraps to first link",
);
fireEvent.keyDown(document.activeElement, { key: "Tab", shiftKey: true });
assert.equal(document.activeElement, close);
fireEvent.click(dialog.parentElement);
assert(screen.getByRole("dialog"), "background click keeps dialog");
fireEvent.keyDown(dialog, { key: "Escape" });
assert.equal(screen.queryByRole("dialog"), null);
assert.equal(document.activeElement, trigger);
cleanup();
console.log(
  "PASS source dialog: attribution, focus trap, backdrop, Escape, focus restoration",
);

const { RegionDialog } = load("components/app/home/RegionDialog");
const requests = [];
let saveFails = true;
let unknownRegion = false;
let saved;
globalThis.fetch = async (url, options = {}) => {
  requests.push({ url: String(url), ...options });
  if (options.method === "PUT" && unknownRegion)
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "unknown",
          details: { reason: "UNKNOWN_REGION" },
        },
      },
      { status: 400 },
    );
  if (options.method === "PUT")
    return saveFails
      ? new Response(
          JSON.stringify({
            error: { code: "SERVICE_UNAVAILABLE", message: "failed" },
          }),
          { status: 503 },
        )
      : Response.json({
          revision: 1,
          region: {
            regionId: "abr:lg:131041",
            label: "東京都 新宿区",
            datasetVersion: "abr-test",
          },
        });
  return Response.json({
    datasetVersion: "abr-test",
    items: [{ regionId: "abr:lg:131041", label: "東京都 新宿区" }],
    hasMore: false,
  });
};
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity } },
});
render(
  h(
    QueryClientProvider,
    { client },
    h(RegionDialog, {
      wardrobeId: "wd_test",
      current: { revision: 0, region: null },
      onSaved: (region) => (saved = region),
      onClose: () => {},
    }),
  ),
);
const input = screen.getByRole("textbox", { name: "市区町村名" });
fireEvent.change(input, { target: { value: "新宿" } });
assert.equal(requests.length, 0, "typing does not search");
const composition = new dom.window.KeyboardEvent("keydown", {
  key: "Enter",
  isComposing: true,
  bubbles: true,
  cancelable: true,
});
input.dispatchEvent(composition);
assert.equal(composition.defaultPrevented, true, "IME Enter prevented");
fireEvent.submit(input.closest("form"));
await screen.findByRole("radio", { name: "東京都 新宿区" });
assert.equal(requests.length, 1);
fireEvent.click(screen.getByRole("radio"));
assert.equal(requests.length, 1, "selection does not save");
fireEvent.click(screen.getByRole("button", { name: "この地域に設定" }));
await screen.findByRole("alert");
assert.equal(
  screen.getByRole("radio").checked,
  true,
  "failed save preserves selection",
);
assert.match(screen.getByRole("alert").textContent, /保存に失敗/);
unknownRegion = true;
fireEvent.click(screen.getByRole("button", { name: "この地域に設定" }));
await waitFor(() =>
  assert.match(
    screen.getByRole("alert").textContent,
    /もう一度検索して地域を選び直して/,
  ),
);
assert.equal(
  screen.getByRole("radio").checked,
  true,
  "unknown code retains selection while guiding re-search",
);
unknownRegion = false;
saveFails = false;
fireEvent.click(screen.getByRole("button", { name: "この地域に設定" }));
await waitFor(() => assert.equal(saved?.revision, 1));
assert.deepEqual(JSON.parse(requests.at(-1).body), {
  regionId: "abr:lg:131041",
  datasetVersion: "abr-test",
  expectedRevision: 0,
});
cleanup();
client.clear();
dom.window.close();
console.log(
  "PASS region dialog: explicit search, IME, selection, failure retention, save DTO",
);
