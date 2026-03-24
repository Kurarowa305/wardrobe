import type {
  CreateTemplateRequest,
  TemplateDetailResponse,
  TemplateListClothingItem,
  TemplateListItem,
  TemplateListOrder,
  TemplateListParams,
  TemplateListResponse,
  TemplateStatus,
  UpdateTemplateRequest,
} from "../schema/templateSchema.js";

export type TemplateStatusDto = TemplateStatus;
export type TemplateListOrderDto = TemplateListOrder;
export type TemplateListParamsDto = TemplateListParams;
export type CreateTemplateRequestDto = CreateTemplateRequest;
export type UpdateTemplateRequestDto = UpdateTemplateRequest;
export type TemplateListClothingItemDto = TemplateListClothingItem;
export type TemplateListItemDto = TemplateListItem;
export type TemplateDetailResponseDto = TemplateDetailResponse;
export type TemplateListResponseDto = TemplateListResponse;

export type TemplateDto = TemplateDetailResponseDto;
