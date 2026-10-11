import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";

type Listener = (phase: "cancel" | "refresh", recordCreated: boolean) => void;
const listeners = new WeakMap<QueryClient, Map<string, Set<Listener>>>();
export function subscribeRecommendations(client: QueryClient, wardrobeId: string, listener: Listener) {
  let wardrobes = listeners.get(client);
  if (!wardrobes) { wardrobes = new Map(); listeners.set(client, wardrobes); }
  let subscribers = wardrobes.get(wardrobeId);
  if (!subscribers) { subscribers = new Set(); wardrobes.set(wardrobeId, subscribers); }
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
}
/** All successful write paths use this boundary before refreshing related queries. */
export async function invalidateRecommendations(client: QueryClient, wardrobeId: string, recordCreated = false) {
  const subscribers = listeners.get(client)?.get(wardrobeId);
  subscribers?.forEach(listener => listener("cancel", recordCreated));
  const queryKey = queryKeys.template.recommendations(wardrobeId);
  await client.cancelQueries({ queryKey });
  await client.invalidateQueries({ queryKey, refetchType: "none" });
  subscribers?.forEach(listener => listener("refresh", recordCreated));
}
