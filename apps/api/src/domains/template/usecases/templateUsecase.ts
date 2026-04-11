import { decodeCursor, encodeCursor, type CursorPrimitive } from "../../../core/cursor/index.js";
import { createAppError } from "../../../core/errors/index.js";
import { createTemplateRepo, templateListIndexNames, type TemplateItem, type TemplateRepo } from "../repo/templateRepo.js";
import type { TemplateDetailResponseDto, TemplateListItemDto, TemplateListOrderDto, TemplateListParamsDto } from "../dto/templateDto.js";
import { createClothingBatchGetRepo, reorderClothingItemsByIds, type BatchGetClothingRepo } from "../../clothing/repo/clothingBatchGetRepo.js";
import { toClothingDetailResponseDto } from "../../clothing/dto/clothingDetailDto.js";
import type { ClothingStatus } from "../../clothing/schema/clothingSchema.js";
import { createTemplateEntity } from "../entities/template.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";

const templateListResource = "template-list";

export type TemplateListCursorPosition = {
  PK: string;
  SK: string;
  statusListPk: string;
  createdAtSk?: string;
  wearCountSk?: string;
  lastWornAtSk?: string;
};

export type ListTemplateUsecaseInput = {
  wardrobeId: string;
  params: TemplateListParamsDto;
  requestId?: string | undefined;
};

export type ListTemplateUsecaseOutput = {
  items: TemplateListItemDto[];
  nextCursor: string | null;
};

export type CreateTemplateUsecaseInput = {
  wardrobeId: string;
  name: string;
  clothingIds: string[];
};

export type CreateTemplateUsecaseOutput = {
  templateId: string;
};

export type GetTemplateUsecaseInput = {
  wardrobeId: string;
  templateId: string;
};

export type GetTemplateUsecaseOutput = TemplateDetailResponseDto;

export type UpdateTemplateUsecaseInput = {
  wardrobeId: string;
  templateId: string;
  name?: string | undefined;
  clothingIds?: string[] | undefined;
};

export type DeleteTemplateUsecaseInput = {
  wardrobeId: string;
  templateId: string;
};

export type TemplateUsecaseRepo = Pick<TemplateRepo, "list" | "create" | "get" | "update" | "delete">;

export type TemplateUsecaseDependencies = {
  repo?: TemplateUsecaseRepo | undefined;
  clothingBatchGetRepo?: Pick<BatchGetClothingRepo, "batchGetByIds"> | undefined;
  now?: (() => number) | undefined;
  generateTemplateId?: (() => string) | undefined;
};

type RepoListResult = Awaited<ReturnType<TemplateUsecaseRepo["list"]>>;
type BatchGetResult = Awaited<ReturnType<BatchGetClothingRepo["batchGetByIds"]>>;

type TemplateListQueryResult = {
  Items?: unknown;
  items?: unknown;
  LastEvaluatedKey?: unknown;
  lastEvaluatedKey?: unknown;
};

type TemplateDetailItem = {
  templateId: string;
  name: string;
  status: "ACTIVE" | "DELETED";
  clothingIds: string[];
  wearCount: number;
  lastWornAt: number;
  createdAt: number;
  deletedAt: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTemplateItem(value: unknown): value is TemplateItem {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.templateId === "string"
    && typeof value.name === "string"
    && Array.isArray(value.clothingIds)
    && value.clothingIds.every((clothingId) => typeof clothingId === "string");
}

function isTemplateDetailResult(value: unknown): value is { Item?: unknown; item?: unknown } {
  return isRecord(value) && ("Item" in value || "item" in value);
}

function isTemplateStatus(value: unknown): value is TemplateDetailItem["status"] {
  return value === "ACTIVE" || value === "DELETED";
}

function extractTemplateItemFromGetResult(result: unknown): TemplateDetailItem | null {
  if (!isTemplateDetailResult(result)) {
    return null;
  }

  const candidate = result.Item ?? result.item;
  if (!isTemplateItem(candidate)) {
    return null;
  }

  const templateCandidate = candidate as Record<string, unknown>;

  return {
    templateId: candidate.templateId,
    name: candidate.name,
    status: isTemplateStatus(templateCandidate.status) ? templateCandidate.status : "ACTIVE",
    clothingIds: candidate.clothingIds,
    wearCount: typeof templateCandidate.wearCount === "number" ? templateCandidate.wearCount : 0,
    lastWornAt: typeof templateCandidate.lastWornAt === "number" ? templateCandidate.lastWornAt : 0,
    createdAt: typeof templateCandidate.createdAt === "number" ? templateCandidate.createdAt : 0,
    deletedAt:
      templateCandidate.deletedAt === null || typeof templateCandidate.deletedAt === "number"
        ? templateCandidate.deletedAt
        : null,
  };
}

function isClothingListItem(value: unknown): value is { clothingId: string; imageKey: string | null; status: ClothingStatus } {
  return isRecord(value)
    && typeof value.clothingId === "string"
    && (value.imageKey === null || typeof value.imageKey === "string")
    && (value.status === "ACTIVE" || value.status === "DELETED");
}

function extractListResult(result: RepoListResult): TemplateListQueryResult {
  if (!isRecord(result)) {
    return {};
  }

  const maybeItem = result as TemplateListQueryResult;
  if ("Items" in maybeItem || "items" in maybeItem || "LastEvaluatedKey" in maybeItem || "lastEvaluatedKey" in maybeItem) {
    return maybeItem;
  }

  return {};
}

function extractItems(result: TemplateListQueryResult): TemplateItem[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.filter(isTemplateItem) as TemplateItem[];
}

function extractLastEvaluatedKey(result: TemplateListQueryResult): TemplateListCursorPosition | null {
  const candidate = result.LastEvaluatedKey ?? result.lastEvaluatedKey;
  if (!isRecord(candidate)) {
    return null;
  }

  const positionEntries = Object.entries(candidate).filter(([, value]) => {
    return value === null || ["string", "number", "boolean"].includes(typeof value);
  }) as [string, CursorPrimitive][];

  if (positionEntries.length === 0) {
    return null;
  }

  const position = Object.fromEntries(positionEntries) as TemplateListCursorPosition;
  if (typeof position.PK !== "string" || typeof position.SK !== "string" || typeof position.statusListPk !== "string") {
    return null;
  }

  return position;
}

function resolveOrder(order: TemplateListOrderDto | undefined): TemplateListOrderDto {
  return order ?? "desc";
}

function decodeListCursor(input: {
  order: TemplateListOrderDto;
  cursor: string | null | undefined;
  requestId?: string | undefined;
}): TemplateListCursorPosition | undefined {
  const position = decodeCursor<TemplateListCursorPosition>({
    resource: templateListResource,
    order: input.order,
    filters: {},
    cursor: input.cursor,
    requestId: input.requestId,
  });

  return position ?? undefined;
}

function encodeListCursor(input: { order: TemplateListOrderDto; position: TemplateListCursorPosition }): string {
  return encodeCursor({
    resource: templateListResource,
    order: input.order,
    filters: {},
    position: input.position,
  });
}

function resolveIndexName() {
  return templateListIndexNames.createdAt;
}

function extractBatchGetItems(result: BatchGetResult): { clothingId: string; imageKey: string | null; status: ClothingStatus }[] {
  return result.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const responses = (entry as { Responses?: unknown }).Responses;
    if (!isRecord(responses)) {
      return [];
    }

    return Object.values(responses).flatMap((response) => {
      if (!Array.isArray(response)) {
        return [];
      }

      return response.filter(isClothingListItem);
    });
  });
}

function extractBatchGetDetailItems(result: BatchGetResult): TemplateDetailResponseDto["clothingItems"] {
  return result.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const responses = (entry as { Responses?: unknown }).Responses;
    if (!isRecord(responses)) {
      return [];
    }

    return Object.values(responses).flatMap((response) => {
      if (!Array.isArray(response)) {
        return [];
      }

      return response
        .map((item) => toClothingDetailResponseDto(item))
        .filter((item): item is NonNullable<typeof item> => item !== null);
    });
  });
}

function toTemplateListItem(item: TemplateItem, clothingItemsById: Map<string, { imageKey: string | null; status: ClothingStatus }>): TemplateListItemDto {
  const clothingItems = reorderClothingItemsByIds(
    item.clothingIds,
    item.clothingIds
      .map((clothingId) => {
        const clothingItem = clothingItemsById.get(clothingId);
        if (!clothingItem) {
          return null;
        }

        return {
          clothingId,
          imageKey: clothingItem.imageKey,
          status: clothingItem.status,
        };
      })
      .filter((candidate): candidate is { clothingId: string; imageKey: string | null; status: ClothingStatus } => candidate !== null),
  );

  return {
    templateId: item.templateId,
    name: item.name,
    clothingItems,
  };
}

export function createTemplateUsecase(dependencies: TemplateUsecaseDependencies = {}) {
  const repo = dependencies.repo ?? createTemplateRepo();
  const clothingBatchGetRepo = dependencies.clothingBatchGetRepo ?? createClothingBatchGetRepo();
  const now = dependencies.now ?? Date.now;
  const generateTemplateId = dependencies.generateTemplateId ?? (() => `tp_${generateUuidV7()}`);

  return {
    async create(input: CreateTemplateUsecaseInput): Promise<CreateTemplateUsecaseOutput> {
      const uniqueIds = new Set(input.clothingIds);
      if (uniqueIds.size !== input.clothingIds.length) {
        throw createAppError("CONFLICT", {
          message: "clothingIds must not contain duplicates.",
          details: {
            reason: "duplicate clothingIds",
          },
        });
      }

      const clothingItems = extractBatchGetItems(await clothingBatchGetRepo.batchGetByIds({
        wardrobeId: input.wardrobeId,
        clothingIds: input.clothingIds,
      }));

      const activeIds = new Set(
        clothingItems
          .filter((item) => item.status === "ACTIVE")
          .map((item) => item.clothingId),
      );
      const missingIds = input.clothingIds.filter((clothingId) => !activeIds.has(clothingId));
      if (missingIds.length > 0) {
        throw createAppError("NOT_FOUND", {
          message: "Referenced clothing was not found.",
          details: {
            resource: "clothing",
            wardrobeId: input.wardrobeId,
            clothingIds: missingIds,
          },
        });
      }

      const templateId = generateTemplateId();
      await repo.create(createTemplateEntity({
        wardrobeId: input.wardrobeId,
        templateId,
        name: input.name,
        clothingIds: input.clothingIds,
        now: now(),
      }));

      return {
        templateId,
      };
    },
    async update(input: UpdateTemplateUsecaseInput): Promise<void> {
      const currentTemplate = extractTemplateItemFromGetResult(await repo.get({
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      }));

      if (!currentTemplate || currentTemplate.status !== "ACTIVE") {
        throw createAppError("NOT_FOUND", {
          message: "Template was not found.",
          details: {
            resource: "template",
            wardrobeId: input.wardrobeId,
            templateId: input.templateId,
          },
        });
      }

      const nextClothingIds = input.clothingIds ?? currentTemplate.clothingIds;
      const uniqueIds = new Set(nextClothingIds);
      if (uniqueIds.size !== nextClothingIds.length) {
        throw createAppError("CONFLICT", {
          message: "clothingIds must not contain duplicates.",
          details: {
            reason: "duplicate clothingIds",
          },
        });
      }

      if (input.clothingIds !== undefined) {
        const clothingItems = extractBatchGetItems(await clothingBatchGetRepo.batchGetByIds({
          wardrobeId: input.wardrobeId,
          clothingIds: nextClothingIds,
        }));

        const activeIds = new Set(
          clothingItems
            .filter((item) => item.status === "ACTIVE")
            .map((item) => item.clothingId),
        );

        const missingIds = nextClothingIds.filter((clothingId) => !activeIds.has(clothingId));
        if (missingIds.length > 0) {
          throw createAppError("NOT_FOUND", {
            message: "Referenced clothing was not found.",
            details: {
              resource: "clothing",
              wardrobeId: input.wardrobeId,
              clothingIds: missingIds,
            },
          });
        }
      }

      await repo.update({
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
        name: input.name ?? currentTemplate.name,
        status: currentTemplate.status,
        clothingIds: nextClothingIds,
        wearCount: currentTemplate.wearCount,
        lastWornAt: currentTemplate.lastWornAt,
        createdAt: currentTemplate.createdAt,
        deletedAt: currentTemplate.deletedAt,
      });
    },
    async delete(input: DeleteTemplateUsecaseInput): Promise<void> {
      const currentTemplate = extractTemplateItemFromGetResult(await repo.get({
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      }));

      if (!currentTemplate || currentTemplate.status !== "ACTIVE") {
        throw createAppError("NOT_FOUND", {
          message: "Template was not found.",
          details: {
            resource: "template",
            wardrobeId: input.wardrobeId,
            templateId: input.templateId,
          },
        });
      }

      await repo.delete({
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
        deletedAt: now(),
      });
    },
    async get(input: GetTemplateUsecaseInput): Promise<GetTemplateUsecaseOutput> {
      const templateItem = extractTemplateItemFromGetResult(await repo.get({
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      }));

      if (!templateItem) {
        throw createAppError("NOT_FOUND", {
          message: "Template was not found.",
          details: {
            resource: "template",
            wardrobeId: input.wardrobeId,
            templateId: input.templateId,
          },
        });
      }

      const clothingItems = extractBatchGetDetailItems(await clothingBatchGetRepo.batchGetByIds({
        wardrobeId: input.wardrobeId,
        clothingIds: templateItem.clothingIds,
      }));
      const clothingMap = new Map(clothingItems.map((item) => [item.clothingId, item]));

      return {
        name: templateItem.name,
        status: templateItem.status,
        wearCount: templateItem.wearCount,
        lastWornAt: templateItem.lastWornAt,
        clothingItems: reorderClothingItemsByIds(
          templateItem.clothingIds,
          templateItem.clothingIds
            .map((clothingId) => clothingMap.get(clothingId))
            .filter((item): item is NonNullable<typeof item> => item !== undefined),
        ),
      };
    },
    async list(input: ListTemplateUsecaseInput): Promise<ListTemplateUsecaseOutput> {
      const order = resolveOrder(input.params.order);
      const decodedCursor = decodeListCursor({
        order,
        cursor: input.params.cursor ?? undefined,
        requestId: input.requestId,
      });

      const listInput = {
        wardrobeId: input.wardrobeId,
        indexName: resolveIndexName(),
        scanIndexForward: order === "asc",
        ...(input.params.limit === undefined ? {} : { limit: input.params.limit }),
        ...(decodedCursor === undefined ? {} : { exclusiveStartKey: decodedCursor }),
      };

      const listResult = extractListResult(await repo.list(listInput));

      const templateItems = extractItems(listResult);
      const uniqueClothingIds = [...new Set(templateItems.flatMap((item) => item.clothingIds))];
      const clothingItemMap = new Map<string, { imageKey: string | null; status: ClothingStatus }>();

      if (uniqueClothingIds.length > 0) {
        const clothingItems = extractBatchGetItems(await clothingBatchGetRepo.batchGetByIds({
          wardrobeId: input.wardrobeId,
          clothingIds: uniqueClothingIds,
        }));

        for (const clothingItem of clothingItems) {
          clothingItemMap.set(clothingItem.clothingId, {
            imageKey: clothingItem.imageKey,
            status: clothingItem.status,
          });
        }
      }

      const lastEvaluatedKey = extractLastEvaluatedKey(listResult);

      return {
        items: templateItems.map((item) => toTemplateListItem(item, clothingItemMap)),
        nextCursor: lastEvaluatedKey
          ? encodeListCursor({
              order,
              position: lastEvaluatedKey,
            })
          : null,
      };
    },
  };
}
