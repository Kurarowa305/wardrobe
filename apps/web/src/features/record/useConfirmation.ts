"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createHistory } from "@/api/endpoints/history";
import { getTemplate } from "@/api/endpoints/template";
import { invalidateHistoryQueries } from "@/api/hooks/history";
import type { RecommendedTemplate } from "@/api/schemas/home";
import {
  ConfirmationController,
  type ConfirmationSnapshot,
} from "./confirmation";
import { RECORD_STRINGS } from "./strings";
const initial: ConfirmationSnapshot = {
  open: false,
  template: null,
  date: "",
  phase: "editing",
  message: null,
};
export function useConfirmation(
  wardrobeId: string,
  notify: (title: string) => void,
) {
  const client = useQueryClient();
  const controller = useRef<ConfirmationController | null>(null);
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const [state, setState] = useState({ wardrobeId, snapshot: initial });
  useEffect(() => {
    const current = new ConfirmationController(wardrobeId, {
      storage: () => window.localStorage,
      create: (body, key) => createHistory(wardrobeId, body, key),
      refreshTemplate: async (templateId) => {
        const template = await getTemplate(wardrobeId, templateId);
        if (
          template.status !== "ACTIVE" ||
          template.clothingItems.some((item) => item.status !== "ACTIVE")
        )
          throw Error("Unavailable template");
        const revision = "revision" in template ? Number(template.revision) : 0;
        return {
          templateId,
          name: template.name,
          tagIds: template.tagIds,
          clothingItems: template.clothingItems,
          revision,
        };
      },
      onSuccess: () => {
        if (controller.current !== current) return;
        notifyRef.current(RECORD_STRINGS.confirmation.success);
        void invalidateHistoryQueries(client, wardrobeId, true).catch(() => {
          /* Saving is already complete; HomeController reports recommendation failure separately. */
        });
      },
    });
    controller.current = current;
    setState({ wardrobeId, snapshot: current.getSnapshot() });
    const unsubscribe = current.subscribe(() =>
      setState({ wardrobeId, snapshot: current.getSnapshot() }),
    );
    return () => {
      unsubscribe();
      controller.current = null;
    };
  }, [wardrobeId, client]);
  return {
    snapshot: state.wardrobeId === wardrobeId ? state.snapshot : initial,
    open: (item: RecommendedTemplate) => controller.current?.open(item),
    close: () => controller.current?.close(),
    setDate: (date: string) => controller.current?.setDate(date),
    submit: () => controller.current?.submit(),
    refresh: () => controller.current?.refresh(),
    strings: RECORD_STRINGS.confirmation,
  };
}
