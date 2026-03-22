export const OPERATION_TOAST_QUERY_KEY = "toast";

export const OPERATION_TOAST_IDS = {
  wardrobeCreated: "wardrobe-created",
  clothingCreated: "clothing-created",
  clothingUpdated: "clothing-updated",
  clothingDeleted: "clothing-deleted",
  templateCreated: "template-created",
  templateUpdated: "template-updated",
  templateDeleted: "template-deleted",
  historyCreated: "history-created",
  historyDeleted: "history-deleted",
} as const;

export type OperationToastId = (typeof OPERATION_TOAST_IDS)[keyof typeof OPERATION_TOAST_IDS];

export function appendOperationToast(pathname: string, toastId: OperationToastId) {
  const searchParams = new URLSearchParams();
  searchParams.set(OPERATION_TOAST_QUERY_KEY, toastId);
  return `${pathname}?${searchParams.toString()}`;
}

export function consumeOperationToast(search: string) {
  const searchParams = new URLSearchParams(search);
  const toastId = searchParams.get(OPERATION_TOAST_QUERY_KEY);
  if (!toastId) {
    return { toastId: null, nextSearch: "" };
  }

  searchParams.delete(OPERATION_TOAST_QUERY_KEY);
  const nextSearch = searchParams.toString();

  return {
    toastId,
    nextSearch: nextSearch.length > 0 ? `?${nextSearch}` : "",
  };
}
