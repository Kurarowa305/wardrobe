import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
const dom = new JSDOM("<html><body></body></html>", {
  url: "http://localhost/",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
const require = createRequire(import.meta.url);
const React = require("react");
const { renderHook, act, cleanup } = require("@testing-library/react");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
const { queryKeys } = load("api/queryKeys");
const { HomeController } = load("features/home/controller");
const history = load("api/hooks/history");
const template = load("api/hooks/template");
const clothing = load("api/hooks/clothing");
const cases = [
  [
    "create history",
    history.useCreateHistoryMutation,
    { date: "20261011", templateId: "tp_1" },
    true,
  ],
  ["delete history", history.useDeleteHistoryMutation, undefined, false],
  [
    "create template",
    template.useCreateTemplateMutation,
    { name: "new", clothingIds: ["cl_1"] },
    false,
  ],
  [
    "update template",
    template.useUpdateTemplateMutation,
    { name: "updated" },
    false,
  ],
  ["delete template", template.useDeleteTemplateMutation, undefined, false],
  [
    "update clothing",
    clothing.useUpdateClothingMutation,
    { name: "updated" },
    false,
  ],
  ["delete clothing", clothing.useDeleteClothingMutation, undefined, false],
];
const tick = () => new Promise((r) => setTimeout(r, 0));
for (const [name, useMutation, body, recordCreated] of cases) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
  const context = {
    wardrobeId: "wd_test",
    regionRevision: 0,
    targetDate: "2026-10-11",
  };
  let calls = 0;
  let blockedResolve;
  const home = new HomeController(
    client,
    "wd_test",
    {
      region: async () => ({ revision: 0, region: null }),
      weather: async (c) => ({ ...c, status: "region_required", region: null }),
      recommendations: async (c, mode) => {
        calls++;
        if (calls === 2) await new Promise((r) => (blockedResolve = r));
        return { ...c, mode, status: "empty", basis: "manual", items: [] };
      },
    },
    () => new Date("2026-10-11T02:00:00Z"),
  );
  await home.enter();
  await tick();
  await home.selectMode("winter");
  await tick();
  const otherKey = queryKeys.template.recommendation(
    "wd_other",
    "summer",
    0,
    "2026-10-11",
  );
  client.setQueryData(otherKey, { unchanged: true });
  const springKey = queryKeys.template.recommendation(
    "wd_test",
    "spring",
    0,
    "2026-10-11",
  );
  client.setQueryData(springKey, { old: true });
  const weatherKey = queryKeys.weather.detail("wd_test", 0, "2026-10-11");
  const weatherBefore = client.getQueryState(weatherKey).dataUpdatedAt;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, ...options };
    return new Response(null, { status: 204 });
  };
  const { result } = renderHook(() => useMutation("wd_test", "item_1"), {
    wrapper: ({ children }) =>
      React.createElement(QueryClientProvider, { client }, children),
  });
  await act(async () => {
    await result.current.mutateAsync(body);
    await tick();
  });
  assert(request, name + " reached HTTP boundary");
  assert.equal(
    client.getQueryState(springKey).isInvalidated,
    true,
    name + " invalidates inactive modes",
  );
  assert.equal(
    client.getQueryState(otherKey).isInvalidated,
    false,
    name + " preserves other wardrobe",
  );
  assert.equal(
    client.getQueryState(weatherKey).dataUpdatedAt,
    weatherBefore,
    name + " preserves weather",
  );
  assert.equal(
    client.getQueryState(weatherKey).isInvalidated,
    false,
    name + " does not stale weather",
  );
  assert.equal(
    home.getSnapshot().mode,
    recordCreated ? "auto" : "winter",
    name + " mode lifecycle",
  );
  assert.equal(calls, 3, name + " refreshes displayed recommendation once");
  blockedResolve();
  await tick();
  assert.equal(
    home.getSnapshot().recommendations.data.mode,
    recordCreated ? "auto" : "winter",
    name + " rejects pre-write late response",
  );
  cleanup();
  home.dispose();
  await tick();
  client.clear();
  console.log("PASS mutation: " + name);
}
dom.window.close();
