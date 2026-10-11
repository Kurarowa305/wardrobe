import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
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
const require = createRequire(import.meta.url),
  React = require("react");
const {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  cleanup,
} = require("@testing-library/react");
const h = React.createElement;
const { ConfirmationController } = load("features/record/confirmation");
const { RecordConfirmationDialog } = load(
  "components/app/home/RecordConfirmationDialog",
);
const { RECORD_STRINGS } = load("features/record/strings");
let sends = 0,
  complete,
  removeCard = () => {};
const template = {
  templateId: "tp_a",
  name: "Long name",
  revision: 1,
  tagIds: [],
  clothingItems: Array.from({ length: 20 }, (_, i) => ({
    clothingId: `cl_${i}`,
    imageKey: null,
    status: "ACTIVE",
  })),
};
const controller = new ConfirmationController("wd_test", {
  storage: () => window.localStorage,
  uuid: () => "550e8400-e29b-41d4-a716-446655440000",
  create: async () => {
    sends++;
    return new Promise((resolve) => (complete = resolve));
  },
  refreshTemplate: async () => template,
  onSuccess: () => removeCard(),
  now: () => new Date("2026-10-11T14:59:59Z"),
});
function App() {
  const state = React.useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const [card, setCard] = React.useState(true);
  removeCard = () => setCard(false);
  return h(
    "main",
    {},
    h("section", {
      "data-record-focus-fallback": true,
      tabIndex: -1,
      "aria-label": "recommendations",
    }),
    card
      ? h("button", { onClick: () => controller.open(template) }, "Open")
      : null,
    h(RecordConfirmationDialog, {
      snapshot: state,
      strings: RECORD_STRINGS.confirmation,
      onClose: () => controller.close(),
      onDate: (value) => controller.setDate(value),
      onSubmit: () => void controller.submit(),
      onRefresh: () => void controller.refresh(),
    }),
  );
}
render(h(App));
let trigger = screen.getByRole("button", { name: "Open" });
trigger.focus();
fireEvent.click(trigger);
let dialog = screen.getByRole("dialog", { name: "着用の記録確認" });
assert(document.activeElement === dialog, "opening must focus the dialog, not the native date picker");
fireEvent.keyDown(dialog, { key: "Tab" });
assert.equal(document.activeElement, screen.getByLabelText("記録日"));
assert.equal(screen.getByText("着用の記録確認").className, "sr-only");
assert.equal(screen.getByLabelText("記録日").value, "2026-10-11");
assert(screen.getByText("+16"));
assert.equal(dialog.querySelectorAll("button").length, 2);
fireEvent.click(dialog.parentElement);
assert(screen.getByRole("dialog"));
fireEvent.keyDown(dialog, { key: "Escape" });
assert.equal(screen.queryByRole("dialog"), null);
assert.equal(document.activeElement, trigger);
assert.equal(sends, 0);
fireEvent.click(trigger);
fireEvent.change(screen.getByLabelText("記録日"), {
  target: { value: "2030-12-31" },
});
fireEvent.click(screen.getByRole("button", { name: "記録する" }));
assert.equal(sends, 1);
fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
assert(screen.getByRole("dialog"));
assert.equal(screen.getByLabelText("記録日").disabled, true);
assert.equal(screen.getByLabelText("記録日").value, "2030-12-31");
await act(async () => {
  complete({ historyId: "hs_a" });
});
await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
assert.equal(
  document.activeElement,
  document.querySelector("[data-record-focus-fallback]"),
);
cleanup();
console.log(
  "confirmation dialog: accessible hidden title, 20 clothes, cancel/Escape, busy lock, source-unmounted focus passed",
);
