"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getWardrobe } from "@/api/endpoints/wardrobe";
import { isAppError } from "@/lib/error/normalize";
import { ROUTES } from "@/constants/routes";
import {
  clearLastWardrobeId,
  readLastWardrobeId,
} from "@/features/routing/lastWardrobeStorage";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const savedWardrobeId = readLastWardrobeId();
    if (!savedWardrobeId) {
      router.replace(ROUTES.wardrobeNew);
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        await getWardrobe(savedWardrobeId);
        if (active) {
          router.replace(ROUTES.home(savedWardrobeId));
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (isAppError(error) && error.status === 404) {
          clearLastWardrobeId();
          router.replace(ROUTES.wardrobeNew);
          return;
        }

        router.replace(ROUTES.home(savedWardrobeId));
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
