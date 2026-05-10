import type { ItemTagIdDto } from "@/api/schemas/itemTag";
import { getItemTagLabel, sortItemTagIds } from "@/features/tags/itemTags";

type ItemTagChipsProps = {
  tagIds: ItemTagIdDto[];
  emptyLabel: string;
};

export function ItemTagChips({ tagIds, emptyLabel }: ItemTagChipsProps) {
  const sortedTagIds = sortItemTagIds(tagIds);

  if (sortedTagIds.length === 0) {
    return <span className="text-sm text-slate-600">{emptyLabel}</span>;
  }

  return (
    <span className="flex flex-wrap gap-2">
      {sortedTagIds.map((tagId) => (
        <span
          key={tagId}
          className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
        >
          {getItemTagLabel(tagId)}
        </span>
      ))}
    </span>
  );
}
