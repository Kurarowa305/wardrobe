"use client";

import { createElement } from "react";
import { useRouter } from "next/navigation";
import { useDeleteTemplateMutation, useTemplate } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { useToast } from "@/components/ui/use-toast";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { formatLastWornDate } from "@/features/history/date";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { isAppError } from "@/lib/error/normalize";
import { Card, CardContent } from "@/components/ui/card";

type TemplateDetailScreenProps = {
  wardrobeId: string;
  templateId: string;
};

function resolveErrorMessage(error: unknown): string {
  if (isAppError(error) && error.status === 404) {
    return TEMPLATE_STRINGS.messages.templateNotFound;
  }

  return TEMPLATE_STRINGS.detail.messages.error;
}

export function TemplateDetailScreen({
  wardrobeId,
  templateId,
}: TemplateDetailScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const templateQuery = useTemplate(wardrobeId, templateId);
  const deleteMutation = useDeleteTemplateMutation(wardrobeId, templateId);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `${COMMON_STRINGS.dialogs.confirmDelete.title}\n${COMMON_STRINGS.dialogs.confirmDelete.message}`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync();
      router.push(ROUTES.templates(wardrobeId));
    } catch {
      toast({
        variant: "destructive",
        title: TEMPLATE_STRINGS.detail.messages.deleteError,
      });
    }
  };

  const content = (
    <Card>
      <CardContent className="grid gap-2 p-4">
        {templateQuery.isPending ? (
          <p className="m-0 text-sm text-slate-600">
            {TEMPLATE_STRINGS.detail.messages.loading}
          </p>
        ) : null}

        {templateQuery.isError ? (
          <p className="m-0 text-sm text-red-700">
            {resolveErrorMessage(templateQuery.error)}
          </p>
        ) : null}

        {templateQuery.data ? (
          <>
            <div className="grid gap-1">
              <p className="m-0 text-lg font-semibold text-slate-900">
                {templateQuery.data.name}
              </p>
              {templateQuery.data.deleted ? (
                <p className="m-0 text-sm font-medium text-amber-700">
                  {TEMPLATE_STRINGS.detail.messages.deleted}
                </p>
              ) : null}
            </div>

            <dl className="m-0 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {TEMPLATE_STRINGS.detail.labels.wearCount}
                </dt>
                <dd className="m-0 text-sm text-slate-900">
                  {templateQuery.data.wearCount}
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {TEMPLATE_STRINGS.detail.labels.lastWornAt}
                </dt>
                <dd className="m-0 text-sm text-slate-900">
                  {formatLastWornDate(
                    templateQuery.data.lastWornAt,
                    TEMPLATE_STRINGS.detail.messages.neverWorn,
                  )}
                </dd>
              </div>
            </dl>

            <div className="grid gap-2">
              <p className="m-0 text-sm font-medium text-slate-900">
                {TEMPLATE_STRINGS.detail.labels.clothingItems}
              </p>
              <ul className="m-0 grid list-none gap-2 p-0">
                {templateQuery.data.clothingItems.map((item) => {
                  const imageUrl = resolveImageUrl(item.imageKey);

                  return (
                    <li key={item.clothingId}>
                      <div className="grid grid-cols-[4rem_1fr] gap-3 rounded-md border border-slate-200 p-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${item.name}の画像`}
                            className="h-16 w-16 rounded-md border border-slate-200 bg-slate-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {COMMON_STRINGS.placeholders.noImage}
                          </div>
                        )}

                        <div className="grid gap-1">
                          <p className="m-0 text-sm font-medium text-slate-900">
                            {item.name}
                          </p>
                          {item.deleted ? (
                            <p className="m-0 text-xs font-medium text-amber-700">
                              {TEMPLATE_STRINGS.detail.messages.clothingDeleted}
                            </p>
                          ) : null}
                          <p className="m-0 text-xs text-slate-600">
                            {TEMPLATE_STRINGS.detail.labels.clothingWearCount}:{" "}
                            {item.wearCount}
                          </p>
                          <p className="m-0 text-xs text-slate-600">
                            {formatLastWornDate(
                              item.lastWornAt,
                              TEMPLATE_STRINGS.detail.messages.neverWorn,
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.detail.title,
    backHref: ROUTES.templates(wardrobeId),
    headerActions: [
      {
        key: "edit",
        label: TEMPLATE_STRINGS.detail.menu.edit,
        href: ROUTES.templateEdit(wardrobeId, templateId),
        disabled: !templateQuery.data || templateQuery.data.deleted,
      },
      {
        key: "delete",
        label: TEMPLATE_STRINGS.detail.menu.delete,
        onSelect: handleDelete,
        disabled:
          !templateQuery.data ||
          templateQuery.data.deleted ||
          deleteMutation.isPending,
      },
    ],
    children: content,
  });
}
