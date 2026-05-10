import type { TemplateEntityShape, TemplateStatus } from "../schema/templateSchema.js";
import type { ItemTagId } from "../../tags/itemTagSchema.js";

export type TemplateEntity = TemplateEntityShape;

export type TemplateEntityKey = {
  wardrobeId: string;
  templateId: string;
};

export type TemplateCoreAttributes = {
  name: string;
  status: TemplateStatus;
  clothingIds: string[];
  tagIds: ItemTagId[];
  wearCount: number;
  lastWornAt: number;
  createdAt: number;
  deletedAt: number | null;
};

export type CreateTemplateEntityInput = TemplateEntityKey & {
  name: string;
  clothingIds: string[];
  tagIds?: ItemTagId[] | undefined;
  now: number;
};

export function createTemplateEntity(input: CreateTemplateEntityInput): TemplateEntity {
  return {
    wardrobeId: input.wardrobeId,
    templateId: input.templateId,
    name: input.name,
    status: "ACTIVE",
    clothingIds: input.clothingIds,
    tagIds: input.tagIds ?? [],
    wearCount: 0,
    lastWornAt: 0,
    createdAt: input.now,
    deletedAt: null,
  };
}

export function markTemplateDeleted(entity: TemplateEntity, deletedAt: number): TemplateEntity {
  return {
    ...entity,
    status: "DELETED",
    deletedAt,
  };
}
