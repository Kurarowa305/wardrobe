import type { PresignCategory, PresignContentType, PresignExtension } from "../schema/presignSchema.js";

export const presignCategoryPrefixMap: Record<PresignCategory, string> = {
  clothing: "clothing",
  template: "template",
};

export type PresignIssueInput = {
  wardrobeId: string;
  contentType: PresignContentType;
  category: PresignCategory;
  extension?: PresignExtension;
};

export type PresignIssueResult = {
  imageKey: string;
  uploadUrl: string;
  method: "PUT";
  expiresAt: string;
};
