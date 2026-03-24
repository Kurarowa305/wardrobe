import type { TemplateEntityShape, TemplateStatus } from "../schema/templateSchema.js";

export type TemplateEntity = TemplateEntityShape;

export type TemplateEntityKey = {
  wardrobeId: string;
  templateId: string;
};

export type TemplateCoreAttributes = {
  name: string;
  status: TemplateStatus;
  clothingIds: string[];
  wearCount: number;
  lastWornAt: number;
  createdAt: number;
  deletedAt: number | null;
};

export type CreateTemplateEntityInput = TemplateEntityKey & {
  name: string;
  clothingIds: string[];
  now: number;
};

export function createTemplateEntity(input: CreateTemplateEntityInput): TemplateEntity {
  return {
    wardrobeId: input.wardrobeId,
    templateId: input.templateId,
    name: input.name,
    status: "ACTIVE",
    clothingIds: input.clothingIds,
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
