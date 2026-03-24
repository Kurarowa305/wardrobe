import type { TemplateEntityKey } from "../entities/template.js";
import type { TemplateStatus } from "../schema/templateSchema.js";

const TEMPLATE_PARTITION_SEGMENT = "TPL";
const CREATED_AT_PREFIX = "CREATED";
const WEAR_COUNT_PREFIX = "WEAR";
const LAST_WORN_AT_PREFIX = "LASTWORN";
const WEAR_COUNT_PAD_LENGTH = 10;

export type TemplateBaseKey = {
  PK: string;
  SK: string;
};

export type TemplateStatusListKeyInput = {
  wardrobeId: string;
  status: TemplateStatus;
};

export type TemplateSortKeyInput = {
  templateId: string;
  value: number;
};

export function buildTemplateBaseKey(input: TemplateEntityKey): TemplateBaseKey {
  return {
    PK: `W#${input.wardrobeId}#${TEMPLATE_PARTITION_SEGMENT}`,
    SK: `TPL#${input.templateId}`,
  };
}

export function buildTemplateStatusListPk(input: TemplateStatusListKeyInput): string {
  return `W#${input.wardrobeId}#${TEMPLATE_PARTITION_SEGMENT}#${input.status}`;
}

export function buildTemplateCreatedAtSk(input: TemplateSortKeyInput): string {
  return `${CREATED_AT_PREFIX}#${input.value}#${input.templateId}`;
}

export function buildTemplateWearCountSk(input: TemplateSortKeyInput): string {
  return `${WEAR_COUNT_PREFIX}#${String(input.value).padStart(WEAR_COUNT_PAD_LENGTH, "0")}#${input.templateId}`;
}

export function buildTemplateLastWornAtSk(input: TemplateSortKeyInput): string {
  return `${LAST_WORN_AT_PREFIX}#${input.value}#${input.templateId}`;
}

export function buildTemplateIndexKeys(input: TemplateEntityKey & {
  status: TemplateStatus;
  createdAt: number;
  wearCount: number;
  lastWornAt: number;
}) {
  return {
    ...buildTemplateBaseKey(input),
    statusListPk: buildTemplateStatusListPk(input),
    createdAtSk: buildTemplateCreatedAtSk({ templateId: input.templateId, value: input.createdAt }),
    wearCountSk: buildTemplateWearCountSk({ templateId: input.templateId, value: input.wearCount }),
    lastWornAtSk: buildTemplateLastWornAtSk({ templateId: input.templateId, value: input.lastWornAt }),
  };
}
