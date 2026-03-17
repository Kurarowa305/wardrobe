import { apiClient } from "@/api/client";
import type {
  GetPresignedUrlRequestDto,
  GetPresignedUrlResponseDto,
} from "@/api/schemas/image";

function buildImagePresignPath(wardrobeId: string) {
  return `/wardrobes/${wardrobeId}/images/presign`;
}

export function getPresignedUrl(
  wardrobeId: string,
  body: GetPresignedUrlRequestDto,
): Promise<GetPresignedUrlResponseDto> {
  return apiClient.post<GetPresignedUrlResponseDto, GetPresignedUrlRequestDto>(
    buildImagePresignPath(wardrobeId),
    {
      body,
    },
  );
}
