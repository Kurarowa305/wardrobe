import type { ItemTagIdDto } from "@/api/schemas/itemTag";

export type ItemTagId = ItemTagIdDto;

export const ITEM_TAGS = [
  { id: "season:summer", label: "夏" },
  { id: "season:winter", label: "冬" },
  { id: "season:all", label: "オールシーズン" },
] as const satisfies ReadonlyArray<{ id: ItemTagId; label: string }>;

export const ITEM_TAG_IDS = ITEM_TAGS.map((tag) => tag.id);

export const ITEM_TAG_LABELS: Record<ItemTagId, string> = {
  "season:summer": "夏",
  "season:winter": "冬",
  "season:all": "オールシーズン",
};

export function getItemTagLabel(tagId: ItemTagId): string {
  return ITEM_TAG_LABELS[tagId];
}

export function sortItemTagIds(tagIds: ItemTagId[]): ItemTagId[] {
  const selected = new Set(tagIds);
  return ITEM_TAG_IDS.filter((tagId) => selected.has(tagId));
}
