import type { ClothingDto } from "@/api/schemas/clothing";
import type { ItemTagIdDto } from "@/api/schemas/itemTag";

export type TemplateStatusDto = "ACTIVE" | "DELETED";
export type TemplateListOrderDto = "asc" | "desc";

export type TemplateListParamsDto = {
  order?: TemplateListOrderDto;
  limit?: number;
  cursor?: string | null;
};

export type CreateTemplateRequestDto = {
  name: string;
  clothingIds: string[];
  tagIds?: ItemTagIdDto[];
};

export type UpdateTemplateRequestDto = {
  name?: string;
  clothingIds?: string[];
  tagIds?: ItemTagIdDto[];
};

export type TemplateListClothingItemDto = Pick<ClothingDto, "clothingId" | "imageKey" | "status">;

export type TemplateListItemDto = {
  templateId: string;
  name: string;
  tagIds: ItemTagIdDto[];
  clothingItems: TemplateListClothingItemDto[];
};

export type TemplateDetailClothingItemDto = ClothingDto;

export type TemplateDto = {
  name: string;
  tagIds: ItemTagIdDto[];
  status: TemplateStatusDto;
  wearCount: number;
  lastWornAt: number;
  clothingItems: TemplateDetailClothingItemDto[];
};

export type TemplateListResponseDto = {
  items: TemplateListItemDto[];
  nextCursor: string | null;
};

export type TemplateDetailResponseDto = TemplateDto;
