export type ImageCategoryDto = "clothing" | "template";
export type PresignedUploadMethodDto = "PUT";

export type GetPresignedUrlRequestDto = {
  contentType: string;
  category: ImageCategoryDto;
  extension?: string;
};

export type GetPresignedUrlResponseDto = {
  imageKey: string;
  uploadUrl: string;
  method: PresignedUploadMethodDto;
  expiresAt: string;
};
