const DEFAULT_IMAGE_PUBLIC_BASE_URL = "/images";

const configuredImagePublicBaseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL?.trim() ?? "";

function resolveImagePublicBaseUrl(): string {
  if (configuredImagePublicBaseUrl.length > 0) {
    return configuredImagePublicBaseUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL is required in production builds.");
  }

  return DEFAULT_IMAGE_PUBLIC_BASE_URL;
}

const IMAGE_PUBLIC_BASE_URL = resolveImagePublicBaseUrl();

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
