const DEFAULT_IMAGE_PUBLIC_BASE_URL = "/images";

const configuredImagePublicBaseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL?.trim();
const IMAGE_PUBLIC_BASE_URL =
  configuredImagePublicBaseUrl && configuredImagePublicBaseUrl.length > 0
    ? configuredImagePublicBaseUrl
    : DEFAULT_IMAGE_PUBLIC_BASE_URL;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeImageKey(imageKey: string): string {
  return imageKey
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function resolveImageUrl(imageKey: string | null | undefined): string | null {
  if (typeof imageKey !== "string") {
    return null;
  }

  const normalizedImageKey = normalizeImageKey(imageKey.trim());
  if (normalizedImageKey.length === 0) {
    return null;
  }

  return `${trimTrailingSlash(IMAGE_PUBLIC_BASE_URL)}/${normalizedImageKey}`;
}
