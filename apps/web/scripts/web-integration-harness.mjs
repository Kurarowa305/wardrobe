import { JSDOM } from "jsdom";
import { createRequire } from "node:module";
export { load } from "./home-test-loader.mjs";
export const dom = new JSDOM("<!doctype html><html><body></body></html>", {
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
export const React = require("react");
export const {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
  within,
} = require("@testing-library/react");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
const {
  AppRouterContext,
} = require("next/dist/shared/lib/app-router-context.shared-runtime");
const {
  SearchParamsContext,
} = require("next/dist/shared/lib/hooks-client-context.shared-runtime");
export function mount(
  Component,
  props = {},
  { search = "wardrobeId=wd_test", strict = false } = {},
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const navigation = [];
  const router = {
    push: (url) => navigation.push(["push", url]),
    replace: (url) => navigation.push(["replace", url]),
    prefetch() {},
  };
  const tree = React.createElement(
    QueryClientProvider,
    { client },
    React.createElement(
      AppRouterContext.Provider,
      { value: router },
      React.createElement(
        SearchParamsContext.Provider,
        { value: new URLSearchParams(search) },
        React.createElement(Component, props),
      ),
    ),
  );
  const view = render(
    strict ? React.createElement(React.StrictMode, null, tree) : tree,
  );
  return {
    ...view,
    client,
    navigation,
    async dispose() {
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));
      client.clear();
    },
  };
}
