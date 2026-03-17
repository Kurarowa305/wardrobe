import type { ClothingDto } from "@/api/schemas/clothing";

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
};

export type UpdateTemplateRequestDto = {
  name?: string;
  clothingIds?: string[];
};

export type TemplateListClothingItemDto = Pick<ClothingDto, "clothingId" | "imageKey" | "status">;

export type TemplateListItemDto = {
  templateId: string;
  name: string;
  clothingItems: TemplateListClothingItemDto[];
};

export type TemplateDetailClothingItemDto = ClothingDto;

export type TemplateDto = {
  name: string;
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
