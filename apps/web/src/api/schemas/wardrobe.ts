export type CreateWardrobeRequestDto = {
  name: string;
};

export type CreateWardrobeResponseDto = {
  wardrobeId: string;
};

const WARDROBE_ID_PATTERN = /^wd_[A-Za-z0-9_-]+$/;

export function isWardrobeId(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return WARDROBE_ID_PATTERN.test(trimmed);
}
