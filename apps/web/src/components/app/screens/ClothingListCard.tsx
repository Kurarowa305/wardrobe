"use client";

import Link from "next/link";

import { COMMON_STRINGS } from "@/constants/commonStrings";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import type { ClothingListItem } from "@/features/clothing/types";

type ClothingListCardProps = {
  item: ClothingListItem;
  href?: string;
  selectable?: boolean;
  checked?: boolean;
  onSelectToggle?: (clothingId: string) => void;
};

export function ClothingListCard({
  item,
  href,
  selectable = false,
  checked = false,
  onSelectToggle,
}: ClothingListCardProps) {
  const imageUrl = resolveImageUrl(item.imageKey);
  const baseClassName = [
    "grid w-full items-center gap-3 rounded-md border border-slate-300 bg-white p-3 text-left transition-colors",
    selectable ? "grid-cols-[56px_minmax(0,1fr)_40px]" : "grid-cols-[56px_minmax(0,1fr)]",
    selectable && checked
      ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,white)]"
      : "hover:bg-slate-50",
  ].join(" ");

  const body = (
    <>
      {imageUrl ? (
        <img src={imageUrl} alt={`${item.name}の画像`} className="h-14 w-14 rounded-md border border-slate-200 bg-slate-100 object-cover" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
          {COMMON_STRINGS.placeholders.noImage}
        </span>
      )}
      <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
      {selectable ? (
        <span className="flex justify-end">
          <span
            aria-hidden="true"
            className={[
              "flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold transition-colors",
              checked
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-slate-300 bg-white text-transparent",
            ].join(" ")}
          >
            ✓
          </span>
        </span>
      ) : null}
    </>
  );

  if (selectable) {
    return (
      <label className={baseClassName}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onSelectToggle?.(item.clothingId)}
          className="sr-only"
        />
        {body}
      </label>
    );
  }

  return (
    <Link href={href ?? "#"} className={baseClassName}>
      {body}
    </Link>
  );
}
