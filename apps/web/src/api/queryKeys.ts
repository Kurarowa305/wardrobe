export type ListOrder = "asc" | "desc";

export type CursorListParams = {
  order?: ListOrder;
  limit?: number;
  cursor?: string | null;
};

export type HistoryListParams = CursorListParams & {
  from?: string | null;
  to?: string | null;
};

type NormalizedCursorListParams = {
  order: ListOrder | null;
  limit: number | null;
  cursor: string | null;
};

type NormalizedHistoryListParams = NormalizedCursorListParams & {
  from: string | null;
  to: string | null;
};

type WardrobeDomain = "clothing" | "template" | "history" | "image";

function normalizeCursorListParams(params: CursorListParams = {}): NormalizedCursorListParams {
  return {
    order: params.order ?? null,
    limit: params.limit ?? null,
    cursor: params.cursor ?? null,
  };
}

function normalizeHistoryListParams(params: HistoryListParams = {}): NormalizedHistoryListParams {
  const normalized = normalizeCursorListParams(params);

  return {
    ...normalized,
    from: params.from ?? null,
    to: params.to ?? null,
  };
}

function wardrobeScope(domain: WardrobeDomain, wardrobeId: string) {
  return [domain, wardrobeId] as const;
}

const clothingScope = (wardrobeId: string) => wardrobeScope("clothing", wardrobeId);
const clothingListScope = (wardrobeId: string) => [...clothingScope(wardrobeId), "list"] as const;
const clothingDetailScope = (wardrobeId: string) => [...clothingScope(wardrobeId), "detail"] as const;

const templateScope = (wardrobeId: string) => wardrobeScope("template", wardrobeId);
const templateListScope = (wardrobeId: string) => [...templateScope(wardrobeId), "list"] as const;
const templateDetailScope = (wardrobeId: string) => [...templateScope(wardrobeId), "detail"] as const;

const historyScope = (wardrobeId: string) => wardrobeScope("history", wardrobeId);
const historyListScope = (wardrobeId: string) => [...historyScope(wardrobeId), "list"] as const;
const historyDetailScope = (wardrobeId: string) => [...historyScope(wardrobeId), "detail"] as const;

const imageScope = (wardrobeId: string) => wardrobeScope("image", wardrobeId);

export const queryKeys = {
  wardrobe: {
    all: ["wardrobe"] as const,
    detail: (wardrobeId: string) => ["wardrobe", wardrobeId, "detail"] as const,
  },
  clothing: {
    all: ["clothing"] as const,
    byWardrobe: (wardrobeId: string) => clothingScope(wardrobeId),
    lists: (wardrobeId: string) => clothingListScope(wardrobeId),
    list: (wardrobeId: string, params: CursorListParams = {}) =>
      [...clothingListScope(wardrobeId), normalizeCursorListParams(params)] as const,
    details: (wardrobeId: string) => clothingDetailScope(wardrobeId),
    detail: (wardrobeId: string, clothingId: string) =>
      [...clothingDetailScope(wardrobeId), clothingId] as const,
  },
  template: {
    all: ["template"] as const,
    byWardrobe: (wardrobeId: string) => templateScope(wardrobeId),
    lists: (wardrobeId: string) => templateListScope(wardrobeId),
    list: (wardrobeId: string, params: CursorListParams = {}) =>
      [...templateListScope(wardrobeId), normalizeCursorListParams(params)] as const,
    details: (wardrobeId: string) => templateDetailScope(wardrobeId),
    detail: (wardrobeId: string, templateId: string) =>
      [...templateDetailScope(wardrobeId), templateId] as const,
  },
  history: {
    all: ["history"] as const,
    byWardrobe: (wardrobeId: string) => historyScope(wardrobeId),
    lists: (wardrobeId: string) => historyListScope(wardrobeId),
    list: (wardrobeId: string, params: HistoryListParams = {}) =>
      [...historyListScope(wardrobeId), normalizeHistoryListParams(params)] as const,
    details: (wardrobeId: string) => historyDetailScope(wardrobeId),
    detail: (wardrobeId: string, historyId: string) =>
      [...historyDetailScope(wardrobeId), historyId] as const,
  },
  image: {
    all: ["image"] as const,
    byWardrobe: (wardrobeId: string) => imageScope(wardrobeId),
    presign: (wardrobeId: string) => [...imageScope(wardrobeId), "presign"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
