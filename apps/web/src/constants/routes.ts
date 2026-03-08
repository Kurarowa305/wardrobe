export type TabKey = "home" | "histories" | "templates" | "clothings";
export type HistoryOrigin = "home" | "histories";

export const DEMO_IDS = {
  wardrobe: "1",
  history: "history-001",
  template: "template-001",
  clothing: "clothing-001",
} as const;

export const ROUTES = {
  root: "/",
  wardrobeNew: "/wardrobes/new",
  wardrobeBase: (wardrobeId: string) => `/wardrobes/${wardrobeId}`,

  home: (wardrobeId: string) => `/wardrobes/${wardrobeId}/home`,
  histories: (wardrobeId: string) => `/wardrobes/${wardrobeId}/histories`,
  historyDetail: (wardrobeId: string, historyId: string, from: HistoryOrigin = "histories") =>
    `/wardrobes/${wardrobeId}/histories/${historyId}?from=${from}`,

  templates: (wardrobeId: string) => `/wardrobes/${wardrobeId}/templates`,
  templateNew: (wardrobeId: string) => `/wardrobes/${wardrobeId}/templates/new`,
  templateDetail: (wardrobeId: string, templateId: string) =>
    `/wardrobes/${wardrobeId}/templates/${templateId}`,
  templateEdit: (wardrobeId: string, templateId: string) =>
    `/wardrobes/${wardrobeId}/templates/${templateId}/edit`,

  clothings: (wardrobeId: string) => `/wardrobes/${wardrobeId}/clothings`,
  clothingNew: (wardrobeId: string) => `/wardrobes/${wardrobeId}/clothings/new`,
  clothingDetail: (wardrobeId: string, clothingId: string) =>
    `/wardrobes/${wardrobeId}/clothings/${clothingId}`,
  clothingEdit: (wardrobeId: string, clothingId: string) =>
    `/wardrobes/${wardrobeId}/clothings/${clothingId}/edit`,

  recordMethod: (wardrobeId: string) => `/wardrobes/${wardrobeId}/record`,
  recordByTemplate: (wardrobeId: string) => `/wardrobes/${wardrobeId}/record/template`,
  recordByCombination: (wardrobeId: string) => `/wardrobes/${wardrobeId}/record/combination`,
} as const;
