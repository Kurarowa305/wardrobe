import { apiClient } from "@/api/client";
import { normalizeUnknownError } from "@/lib/error/normalize";
import type {
  GetPresignedUrlRequestDto,
  GetPresignedUrlResponseDto,
  ImageCategoryDto,
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

function normalizeExtension(fileName: string): string | undefined {
  const matched = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return matched?.[1];
}

function resolveContentType(file: File): string {
  const normalizedType = file.type.trim().toLowerCase();
  if (normalizedType.startsWith("image/")) {
    return normalizedType;
  }

  const extension = normalizeExtension(file.name);
  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }
  if (extension) {
    return `image/${extension}`;
  }

  return "image/png";
}

export async function uploadImageWithPresign(
  wardrobeId: string,
  category: ImageCategoryDto,
  file: File,
): Promise<GetPresignedUrlResponseDto> {
  try {
    const contentType = resolveContentType(file);
    const extension = normalizeExtension(file.name);
    const presigned = await getPresignedUrl(wardrobeId, {
      contentType,
      category,
      extension,
    });

    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`upload failed with status ${uploadResponse.status}`);
    }

    return presigned;
  } catch (error) {
    throw normalizeUnknownError(error, "画像アップロードに失敗しました。");
  }
}
