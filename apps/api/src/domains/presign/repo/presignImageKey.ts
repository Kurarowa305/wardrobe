import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { presignCategoryPrefixMap, type PresignIssueInput } from "../entities/presign.js";
import type { PresignContentType, PresignExtension } from "../schema/presignSchema.js";

const contentTypeExtensionMap: Record<PresignContentType, PresignExtension> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type BuildPresignImageKeyInput = Pick<PresignIssueInput, "wardrobeId" | "category" | "contentType" | "extension">;

export type BuildPresignImageKeyDependencies = {
  generateUuid?: (() => string) | undefined;
};

export function resolvePresignExtension(input: { contentType: PresignContentType; extension?: PresignExtension }): PresignExtension {
  return input.extension ?? contentTypeExtensionMap[input.contentType];
}

export function buildPresignImageKey(
  input: BuildPresignImageKeyInput,
  dependencies: BuildPresignImageKeyDependencies = {},
): string {
  const prefix = presignCategoryPrefixMap[input.category];
  const extension = resolvePresignExtension({
    contentType: input.contentType,
    extension: input.extension,
  });
  const generateUuid = dependencies.generateUuid ?? generateUuidV7;

  return `${prefix}/${input.wardrobeId}/${generateUuid()}.${extension}`;
}
