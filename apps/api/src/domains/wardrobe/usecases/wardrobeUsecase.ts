import { randomBytes } from "node:crypto";

import { createAppError } from "../../../core/errors/index.js";
import { createWardrobeRepo, type WardrobeMetaItem, type WardrobeRepo } from "../repo/wardrobeRepo.js";

export type CreateWardrobeUsecaseInput = {
  name: string;
};

export type CreateWardrobeUsecaseOutput = {
  wardrobeId: string;
};

export type GetWardrobeUsecaseInput = {
  wardrobeId: string;
};

export type GetWardrobeUsecaseOutput = {
  wardrobeId: string;
  name: string;
  createdAt: number;
};

export type WardrobeUsecaseRepo = Pick<WardrobeRepo, "create" | "get">;

export type WardrobeUsecaseDependencies = {
  repo?: WardrobeUsecaseRepo | undefined;
  now?: (() => number) | undefined;
  generateWardrobeId?: (() => string) | undefined;
};

type RepoGetResult = Awaited<ReturnType<WardrobeUsecaseRepo["get"]>>;

function extractWardrobeItem(result: RepoGetResult): WardrobeMetaItem | null {
  if (result && typeof result === "object") {
    const candidate = (result as { Item?: unknown; item?: unknown }).Item ?? (result as { item?: unknown }).item;

    if (
      candidate &&
      typeof candidate === "object" &&
      "wardrobeId" in candidate &&
      "name" in candidate &&
      "createdAt" in candidate
    ) {
      return candidate as WardrobeMetaItem;
    }
  }

  return null;
}

export function generateUuidV7(): string {
  const bytes = randomBytes(16);
  let timestamp = Date.now();

  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp & 0xff;
    timestamp = Math.floor(timestamp / 256);
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export function generateWardrobeId(): string {
  return `wd_${generateUuidV7()}`;
}

export function createWardrobeUsecase(dependencies: WardrobeUsecaseDependencies = {}) {
  const repo = dependencies.repo ?? createWardrobeRepo();
  const now = dependencies.now ?? Date.now;
  const generateWardrobeIdFn = dependencies.generateWardrobeId ?? generateWardrobeId;

  return {
    async create(input: CreateWardrobeUsecaseInput): Promise<CreateWardrobeUsecaseOutput> {
      const wardrobeId = generateWardrobeIdFn();

      await repo.create({
        wardrobeId,
        name: input.name,
        createdAt: now(),
      });

      return { wardrobeId };
    },
    async get(input: GetWardrobeUsecaseInput): Promise<GetWardrobeUsecaseOutput> {
      const result = await repo.get({ wardrobeId: input.wardrobeId });
      const item = extractWardrobeItem(result);

      if (!item) {
        throw createAppError("NOT_FOUND", {
          message: "Wardrobe was not found.",
          details: {
            resource: "wardrobe",
            wardrobeId: input.wardrobeId,
          },
        });
      }

      return {
        wardrobeId: item.wardrobeId,
        name: item.name,
        createdAt: item.createdAt,
      };
    },
  };
}
