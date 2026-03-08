import { ROUTES } from "@/constants/routes";

export function resolveHistoryDetailBackHref(wardrobeId: string, from: string | null) {
  return from === "home" ? ROUTES.home(wardrobeId) : ROUTES.histories(wardrobeId);
}
