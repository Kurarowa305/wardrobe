"use client";

import { FormEvent, createElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { uploadImageWithPresign } from "@/api/endpoints/image";
import { useCreateClothingMutation } from "@/api/hooks/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { OPERATION_TOAST_IDS, appendOperationToast } from "@/features/toast/operationToast";

type ClothingCreateScreenProps = {
  wardrobeId: string;
};

export function ClothingCreateScreen({ wardrobeId }: ClothingCreateScreenProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  const createMutation = useCreateClothingMutation(wardrobeId);

  useEffect(() => {
    if (!selectedImageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImageFile]);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isNameEmpty = trimmedName.length === 0;
  const showNameError = nameTouched && isNameEmpty;
  const isPending = createMutation.isPending || isUploadingImage;

  const uploadImage = async (file: File): Promise<string> => {
    setUploadError(null);
    setIsUploadingImage(true);
    try {
      const presigned = await uploadImageWithPresign(wardrobeId, "clothing", file);
      return presigned.imageKey;
    } catch (error) {
      setUploadError(CLOTHING_STRINGS.create.messages.uploadError);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setNameTouched(true);

    if (isNameEmpty || isPending) {
      return;
    }

    let uploadedImageKey: string | null = null;

    if (selectedImageFile) {
      try {
        uploadedImageKey = await uploadImage(selectedImageFile);
      } catch {
        return;
      }
    }

    await createMutation.mutateAsync({
      name: trimmedName,
      imageKey: uploadedImageKey,
    });

    router.push(appendOperationToast(ROUTES.clothings(wardrobeId), OPERATION_TOAST_IDS.clothingCreated));
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setUploadError(null);
  };

  const handleRetryUpload = async () => {
    if (!selectedImageFile || isUploadingImage) {
      return;
    }

    try {
      await uploadImage(selectedImageFile);
    } catch {
      // エラー文言は uploadImage 内で設定する。
    }
  };

  const content = (
    <div className="grid gap-4">
      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="clothing-image-file">
          <span>{CLOTHING_STRINGS.create.labels.imageFile}</span>
          <Input
            id="clothing-image-file"
            name="imageFile"
            type="file"
            accept="image/*"
            onChange={(event) => {
              setSelectedImageFile(event.target.files?.[0] ?? null);
              setUploadError(null);
            }}
          />
        </label>

        {previewUrl ? (
          <div className="grid gap-2">
            <img
              src={previewUrl}
              alt={CLOTHING_STRINGS.create.messages.previewAlt}
              className="h-40 w-full rounded-md border border-slate-200 object-cover"
            />
            <Button type="button" variant="outline" onClick={clearSelectedImage}>
              {CLOTHING_STRINGS.create.actions.clearImage}
            </Button>
          </div>
        ) : (
          <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.create.messages.noPreview}</p>
        )}

        <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="clothing-name">
          <span>{CLOTHING_STRINGS.create.labels.name}</span>
          <Input
            id="clothing-name"
            name="name"
            type="text"
            value={name}
            onBlur={() => setNameTouched(true)}
            onChange={(event) => setName(event.target.value)}
            placeholder={CLOTHING_STRINGS.create.placeholders.name}
            autoComplete="off"
            aria-invalid={showNameError}
            aria-describedby={showNameError ? "clothing-name-error" : undefined}
          />
        </label>

        {showNameError ? (
          <p id="clothing-name-error" className="m-0 text-sm text-red-700">
            {CLOTHING_STRINGS.create.messages.nameRequired}
          </p>
        ) : null}

        {createMutation.isError ? (
          <p className="m-0 text-sm text-red-700">{CLOTHING_STRINGS.create.messages.submitError}</p>
        ) : null}

        {uploadError ? (
          <div className="grid gap-2">
            <p className="m-0 text-sm text-red-700">{uploadError}</p>
            <Button type="button" variant="outline" onClick={handleRetryUpload} disabled={isUploadingImage}>
              {CLOTHING_STRINGS.create.actions.retryUpload}
            </Button>
          </div>
        ) : null}

        <Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>
          {isUploadingImage ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              {CLOTHING_STRINGS.create.messages.uploadingImage}
            </span>
          ) : createMutation.isPending ? (
            CLOTHING_STRINGS.create.messages.submitting
          ) : (
            CLOTHING_STRINGS.create.actions.submit
          )}
        </Button>
      </form>
    </div>
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.create.title,
    backHref: ROUTES.clothings(wardrobeId),
    children: content,
  });
}
