import type { ClothingGenreDto } from "@/api/schemas/clothing";
import type { ClothingListItem } from "@/features/clothing/types";

export const CLOTHING_GENRES = ["tops", "bottoms", "others"] as const satisfies readonly ClothingGenreDto[];

export const CLOTHING_GENRE_LABELS: Record<ClothingGenreDto, string> = {
  tops: "トップス",
  bottoms: "ボトムス",
  others: "その他",
};

export function ClothingGenreIcon({ genre, className = "h-5 w-5", title }: { genre: ClothingGenreDto; className?: string; title?: string }) {
  const label = title ?? CLOTHING_GENRE_LABELS[genre];
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    role: "img" as const,
    "aria-label": label,
  };

  if (genre === "tops") {
    return (
      <svg {...commonProps}>
        <path d="M9 3q3 3 6 0l4 1 2 5-4 2v10H7V11l-4-2 2-5 4-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (genre === "bottoms") {
    return (
      <svg {...commonProps}>
        <>
          <path d="M7 3h10l1.5 18h-4.5L12 11l-2 10H5.5L7 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 20v-2.5A3.5 3.5 0 0 1 10 14h4a3.5 3.5 0 0 1 3.5 3.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function groupClothingItemsByGenre(items: ClothingListItem[]) {
  return {
    tops: items.filter((item) => item.genre === "tops"),
    bottoms: items.filter((item) => item.genre === "bottoms"),
    others: items.filter((item) => item.genre === "others"),
  } satisfies Record<ClothingGenreDto, ClothingListItem[]>;
}
