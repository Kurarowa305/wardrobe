export type TabKey = "home" | "histories" | "templates" | "clothings";
export type HistoryOrigin = "home" | "histories";

export const DEMO_IDS = {
  wardrobe: "1",
  history: "history-001",
  template: "tp_01HZZBBB",
  clothing: "clothing-001",
} as const;

const ROUTE_QUERY_KEYS = {
  wardrobeId: "wardrobeId",
  historyId: "historyId",
  templateId: "templateId",
  clothingId: "clothingId",
  from: "from",
} as const;

function buildPathWithQuery(pathname: string, query: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (!value) {
      continue;
    }

    searchParams.set(key, value);
  }

  const serialized = searchParams.toString();
  return serialized.length > 0 ? `${pathname}?${serialized}` : pathname;
}

export const ROUTES = {
  root: "/",
  wardrobeNew: "/wardrobes/new",
  wardrobeBase: (wardrobeId: string) =>
    buildPathWithQuery("/home", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),

  home: (wardrobeId: string) =>
    buildPathWithQuery("/home", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  histories: (wardrobeId: string) =>
    buildPathWithQuery("/histories", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  historyDetail: (wardrobeId: string, historyId: string, from: HistoryOrigin = "histories") =>
    buildPathWithQuery("/histories/detail", {
      [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId,
      [ROUTE_QUERY_KEYS.historyId]: historyId,
      [ROUTE_QUERY_KEYS.from]: from,
    }),

  templates: (wardrobeId: string) =>
    buildPathWithQuery("/templates", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  templateNew: (wardrobeId: string) =>
    buildPathWithQuery("/templates/new", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  templateDetail: (wardrobeId: string, templateId: string) =>
    buildPathWithQuery("/templates/detail", {
      [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId,
      [ROUTE_QUERY_KEYS.templateId]: templateId,
    }),
  templateEdit: (wardrobeId: string, templateId: string) =>
    buildPathWithQuery("/templates/edit", {
      [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId,
      [ROUTE_QUERY_KEYS.templateId]: templateId,
    }),

  clothings: (wardrobeId: string) =>
    buildPathWithQuery("/clothings", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  clothingNew: (wardrobeId: string) =>
    buildPathWithQuery("/clothings/new", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  clothingDetail: (wardrobeId: string, clothingId: string) =>
    buildPathWithQuery("/clothings/detail", {
      [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId,
      [ROUTE_QUERY_KEYS.clothingId]: clothingId,
    }),
  clothingEdit: (wardrobeId: string, clothingId: string) =>
    buildPathWithQuery("/clothings/edit", {
      [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId,
      [ROUTE_QUERY_KEYS.clothingId]: clothingId,
    }),

  recordMethod: (wardrobeId: string) =>
    buildPathWithQuery("/record", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  recordByTemplate: (wardrobeId: string) =>
    buildPathWithQuery("/record/template", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
  recordByCombination: (wardrobeId: string) =>
    buildPathWithQuery("/record/combination", { [ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId }),
} as const;
