import type {
  ClothingDetailResponse,
  ClothingGenre,
  ClothingListItem,
  ClothingListOrder,
  ClothingListParams,
  ClothingListResponse,
  ClothingStatus,
  CreateClothingRequest,
  UpdateClothingRequest,
} from "../schema/clothingSchema.js";

export type ClothingStatusDto = ClothingStatus;
export type ClothingGenreDto = ClothingGenre;
export type ClothingListOrderDto = ClothingListOrder;
export type ClothingListParamsDto = ClothingListParams;
export type CreateClothingRequestDto = CreateClothingRequest;
export type UpdateClothingRequestDto = UpdateClothingRequest;
export type ClothingListItemDto = ClothingListItem;
export type ClothingDetailResponseDto = ClothingDetailResponse;
export type ClothingListResponseDto = ClothingListResponse;

export type ClothingDto = ClothingDetailResponseDto;
