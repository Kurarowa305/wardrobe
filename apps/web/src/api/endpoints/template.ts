import { apiClient } from "@/api/client";
import type {
  CreateTemplateRequestDto,
  TemplateDetailResponseDto,
  TemplateListParamsDto,
  TemplateListResponseDto,
  UpdateTemplateRequestDto,
} from "@/api/schemas/template";

function buildTemplateCollectionPath(wardrobeId: string) {
  return `/wardrobes/${wardrobeId}/templates`;
}

function buildTemplateDetailPath(wardrobeId: string, templateId: string) {
  return `${buildTemplateCollectionPath(wardrobeId)}/${templateId}`;
}

export function listTemplates(
  wardrobeId: string,
  params: TemplateListParamsDto = {},
): Promise<TemplateListResponseDto> {
  return apiClient.get<TemplateListResponseDto>(buildTemplateCollectionPath(wardrobeId), {
    query: params,
  });
}

export function getTemplate(
  wardrobeId: string,
  templateId: string,
): Promise<TemplateDetailResponseDto> {
  return apiClient.get<TemplateDetailResponseDto>(buildTemplateDetailPath(wardrobeId, templateId));
}

export function createTemplate(
  wardrobeId: string,
  body: CreateTemplateRequestDto,
): Promise<void> {
  return apiClient.post<void, CreateTemplateRequestDto>(buildTemplateCollectionPath(wardrobeId), {
    body,
  });
}

export function updateTemplate(
  wardrobeId: string,
  templateId: string,
  body: UpdateTemplateRequestDto,
): Promise<void> {
  return apiClient.patch<void, UpdateTemplateRequestDto>(
    buildTemplateDetailPath(wardrobeId, templateId),
    {
      body,
    },
  );
}

export function deleteTemplate(wardrobeId: string, templateId: string): Promise<void> {
  return apiClient.delete<void>(buildTemplateDetailPath(wardrobeId, templateId));
}
