import { isWardrobeId } from "@/api/schemas/wardrobe";

const LAST_WARDROBE_ID_STORAGE_KEY = "wardrobe:last-wardrobe-id";

function readStorageValue() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(LAST_WARDROBE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readLastWardrobeId() {
  const value = readStorageValue();
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return isWardrobeId(trimmed) ? trimmed : null;
}

export function writeLastWardrobeId(wardrobeId: string) {
  if (typeof window === "undefined" || !isWardrobeId(wardrobeId)) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_WARDROBE_ID_STORAGE_KEY, wardrobeId.trim());
  } catch {
    // Ignore storage write failures and keep runtime navigation working.
  }
}

export function clearLastWardrobeId() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LAST_WARDROBE_ID_STORAGE_KEY);
  } catch {
    // Ignore storage clear failures and keep runtime navigation working.
  }
}
