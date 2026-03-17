import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "@/api/endpoints/template";
import { queryKeys } from "@/api/queryKeys";
import type {
  CreateTemplateRequestDto,
  TemplateListParamsDto,
  UpdateTemplateRequestDto,
} from "@/api/schemas/template";
import { toTemplate, toTemplateListItem } from "@/features/template/types";

const TEMPLATE_LIST_STALE_TIME_MS = 60_000;

type TemplateIdentity = {
  wardrobeId: string;
  templateId: string;
};

async function invalidateTemplateListQueries(queryClient: QueryClient, wardrobeId: string) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.template.lists(wardrobeId),
  });
}

async function invalidateTemplateRelatedQueries(
  queryClient: QueryClient,
  { wardrobeId, templateId }: TemplateIdentity,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.template.detail(wardrobeId, templateId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.template.lists(wardrobeId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.history.byWardrobe(wardrobeId),
    }),
  ]);
}

export function useTemplateList(wardrobeId: string, params: TemplateListParamsDto = {}) {
  return useQuery({
    queryKey: queryKeys.template.list(wardrobeId, params),
    queryFn: () => listTemplates(wardrobeId, params),
    staleTime: TEMPLATE_LIST_STALE_TIME_MS,
    enabled: wardrobeId.length > 0,
    select: (response) => ({
      items: response.items.map(toTemplateListItem),
      nextCursor: response.nextCursor,
    }),
  });
}

export function useTemplate(wardrobeId: string, templateId: string) {
  return useQuery({
    queryKey: queryKeys.template.detail(wardrobeId, templateId),
    queryFn: () => getTemplate(wardrobeId, templateId),
    enabled: wardrobeId.length > 0 && templateId.length > 0,
    select: toTemplate,
  });
}

export function useCreateTemplateMutation(wardrobeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.template.byWardrobe(wardrobeId),
    mutationFn: (body: CreateTemplateRequestDto) => createTemplate(wardrobeId, body),
    onSuccess: async () => {
      await invalidateTemplateListQueries(queryClient, wardrobeId);
    },
  });
}

export function useUpdateTemplateMutation(wardrobeId: string, templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.template.detail(wardrobeId, templateId),
    mutationFn: (body: UpdateTemplateRequestDto) => updateTemplate(wardrobeId, templateId, body),
    onSuccess: async () => {
      await invalidateTemplateRelatedQueries(queryClient, { wardrobeId, templateId });
    },
  });
}

export function useDeleteTemplateMutation(wardrobeId: string, templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.template.detail(wardrobeId, templateId),
    mutationFn: () => deleteTemplate(wardrobeId, templateId),
    onSuccess: async () => {
      await invalidateTemplateRelatedQueries(queryClient, { wardrobeId, templateId });
    },
  });
}
