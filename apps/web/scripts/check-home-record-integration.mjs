import assert from "node:assert/strict";
import {
  dom,
  React,
  screen,
  fireEvent,
  waitFor,
  within,
  mount,
  load,
  act,
} from "./web-integration-harness.mjs";
const { HomeTabScreen } = load("components/app/screens/HomeTabScreen");
const { useToast } = load("components/ui/use-toast");
// Observe the public toast hook alongside the real screen without replacing its notification path.
function HomeWithNotifications() {
  const { toasts } = useToast();
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(HomeTabScreen, { wardrobeId: "wd_test" }),
    React.createElement(
      "output",
      { "aria-label": "notifications" },
      toasts.map((t) => t.title).join(" "),
    ),
  );
}
let saved = false;
const writes = [];
const reads = [];
globalThis.fetch = async (url, options = {}) => {
  const u = new URL(url, "http://localhost");
  reads.push(u.pathname + u.search);
  if (u.pathname.endsWith("/histories") && options.method === "POST") {
    writes.push({
      body: JSON.parse(options.body),
      key: new Headers(options.headers).get("Idempotency-Key"),
    });
    saved = true;
    return Response.json({ historyId: "hi_confirmed" });
  }
  if (u.pathname.endsWith("/region"))
    return Response.json({
      revision: 1,
      region: {
        regionId: "abr:lg:131016",
        label: "東京都 千代田区",
        datasetVersion: "abr-2026-01",
      },
    });
  const context = {
    wardrobeId: "wd_test",
    regionRevision: 1,
    targetDate: u.searchParams.get("date"),
  };
  if (u.pathname.endsWith("/weather"))
    return Response.json({
      ...context,
      status: "unavailable",
      reason: "fetch_failed",
      retryAfter: null,
    });
  if (u.pathname.endsWith("/recommendations/templates")) {
    if (saved)
      return Response.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Temporary recommendation failure",
          },
        },
        { status: 503 },
      );
    const mode = u.searchParams.get("mode");
    return Response.json({
      ...context,
      mode,
      status: mode === "auto" ? "weather_required" : "ready",
      basis: mode === "auto" ? "none" : "manual",
      ...(mode === "auto" ? { reason: "fetch_failed", retryAfter: null } : {}),
      items:
        mode === "auto"
          ? []
          : [
              {
                templateId: "tp_test",
                name: "記録する夏服",
                revision: 7,
                tagIds: [],
                clothingItems: [
                  {
                    clothingId: "cl_top",
                    imageKey: "wardrobe/夏 服.jpg",
                    status: "ACTIVE",
                  },
                ],
              },
            ],
    });
  }
  assert.match(u.pathname, /\/wardrobes\/wd_test$/);
  return Response.json({ name: "結合確認" });
};
const view = mount(HomeWithNotifications);
await screen.findByText(
  "自動判定に必要な天気情報がありません。季節を選んでください。",
);
assert(
  screen.getByText(
    "天気を取得できませんでした。季節を選んでおすすめを表示できます。",
  ),
);
const source = screen.getByRole("link", {
  name: "天気情報の出典（Open-Meteo）",
});
source.focus();
fireEvent.click(source);
const attribution = screen.getByRole("dialog", {
  name: "天気・地域情報の出典",
});
assert.equal(
  within(attribution).getByRole("link", { name: "CC BY 4.0" }).href,
  "https://creativecommons.org/licenses/by/4.0/",
);
assert(within(attribution).getByRole("link", { name: "PDL1.0" }));
assert(
  attribution.contains(document.activeElement),
  "unavailable weather still exposes focused source dialog",
);
fireEvent.keyDown(attribution, { key: "Escape" });
assert.equal(document.activeElement, source);
fireEvent.click(screen.getByRole("button", { name: "夏" }));
const card = await screen.findByRole("button", { name: /記録する夏服/ });
assert.equal(
  within(card).getByRole("img").getAttribute("src"),
  "/images/wardrobe/%E5%A4%8F%20%E6%9C%8D.jpg",
);
fireEvent.click(card);
const confirmation = screen.getByRole("dialog", { name: "着用の記録確認" });
fireEvent.change(within(confirmation).getByLabelText("記録日"), {
  target: { value: "2030-07-25" },
});
fireEvent.click(within(confirmation).getByRole("button", { name: "記録する" }));
await waitFor(() => assert.equal(Boolean(screen.queryByRole("dialog")), false));
await screen.findByText("記録しました。おすすめの更新に失敗しました。");
assert.equal(
  screen.getByLabelText("notifications").textContent,
  "記録しました",
);
assert.equal(
  screen.getByRole("button", { name: "自動" }).getAttribute("aria-pressed"),
  "true",
);
assert.deepEqual(
  writes.map((x) => x.body),
  [{ date: "20300725", templateId: "tp_test", expectedTemplateRevision: 7 }],
);
assert.match(writes[0].key, /^[0-9a-f-]{36}$/i);
assert.equal(
  dom.window.localStorage.length,
  0,
  "confirmed operation removed despite recommendation refresh failure",
);
assert.equal(
  reads.filter((x) => x.includes("/weather?")).length,
  1,
  "record completion preserves weather",
);
assert(
  reads.at(-1).includes("mode=auto"),
  "record completion refetches automatic recommendations",
);
fireEvent.click(screen.getByRole("button", { name: "おすすめを再取得" }));
await screen.findByText("記録しました。おすすめの更新に失敗しました。");
assert.equal(
  writes.length,
  1,
  "recommendation retry never repeats record creation",
);
await view.dispose();
// Crossing a JST day boundary refreshes Home, but does not change a confirmation already edited.
const RealDate = globalThis.Date;
let clock = RealDate.parse("2026-10-11T14:59:50Z");
globalThis.Date = class extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [clock]));
  }
  static now() {
    return clock;
  }
};
saved = false;
const midnightView = mount(HomeWithNotifications);
await screen.findByText(
  "自動判定に必要な天気情報がありません。季節を選んでください。",
);
fireEvent.click(screen.getByRole("button", { name: "夏" }));
fireEvent.click(await screen.findByRole("button", { name: /記録する夏服/ }));
assert.equal(screen.getByLabelText("記録日").value, "2026-10-11");
fireEvent.change(screen.getByLabelText("記録日"), {
  target: { value: "2030-07-25" },
});
clock = RealDate.parse("2026-10-11T15:00:01Z");
await act(async () => {
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
});
await waitFor(() =>
  assert.equal(document.querySelector("time").textContent, "2026-10-12"),
);
assert.equal(
  screen.getByLabelText("記録日").value,
  "2030-07-25",
  "JST rollover/resume leaves open confirmation input untouched",
);
assert.equal(
  screen.getByRole("button", { name: "自動" }).getAttribute("aria-pressed"),
  "true",
);
assert.equal(writes.length, 1, "resume never submits the edited confirmation");
await midnightView.dispose();
globalThis.Date = RealDate;
dom.window.close();
console.log(
  "PASS home record integration: unavailable weather/manual/source accessibility, actual confirmation POST, future date/revision/idempotency key, success notification + auto reset independent of recommendation failure, open confirmation date preserved over JST rollover/resume",
);
