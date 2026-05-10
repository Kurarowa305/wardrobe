import type {
  TemplateDetailClothingItemDto,
  TemplateDetailResponseDto,
  TemplateListClothingItemDto,
  TemplateListItemDto,
} from "@/api/schemas/template";
import type { ItemTagIdDto } from "@/api/schemas/itemTag";

export type TemplateListClothingItem = {
  clothingId: string;
  imageKey: string | null;
  deleted: boolean;
};

export type TemplateListItem = {
  templateId: string;
  name: string;
  tagIds: ItemTagIdDto[];
  clothingItems: TemplateListClothingItem[];
};

export type TemplateClothingItem = {
  clothingId: string;
  name: string;
  imageKey: string | null;
  wearCount: number;
  lastWornAt: number | null;
  deleted: boolean;
};

export type Template = {
  name: string;
  tagIds: ItemTagIdDto[];
  wearCount: number;
  lastWornAt: number | null;
  deleted: boolean;
  clothingItems: TemplateClothingItem[];
};

export function toTemplateListClothingItem(
  dto: TemplateListClothingItemDto,
): TemplateListClothingItem {
  return {
    clothingId: dto.clothingId,
    imageKey: dto.imageKey,
    deleted: dto.status === "DELETED",
  };
}

export function toTemplateListItem(dto: TemplateListItemDto): TemplateListItem {
  return {
    templateId: dto.templateId,
    name: dto.name,
    tagIds: dto.tagIds,
    clothingItems: dto.clothingItems.map(toTemplateListClothingItem),
  };
}

export function toTemplateClothingItem(dto: TemplateDetailClothingItemDto): TemplateClothingItem {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    imageKey: dto.imageKey,
    wearCount: dto.wearCount,
    lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,
    deleted: dto.status === "DELETED",
  };
}

export function toTemplate(dto: TemplateDetailResponseDto): Template {
  return {
    name: dto.name,
    tagIds: dto.tagIds,
    wearCount: dto.wearCount,
    lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,
    deleted: dto.status === "DELETED",
    clothingItems: dto.clothingItems.map(toTemplateClothingItem),
  };
}
