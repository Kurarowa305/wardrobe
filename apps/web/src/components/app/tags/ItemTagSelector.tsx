import type { ItemTagIdDto } from "@/api/schemas/itemTag";
import { ITEM_TAGS, sortItemTagIds } from "@/features/tags/itemTags";

type ItemTagSelectorProps = {
  label: string;
  selectedTagIds: ItemTagIdDto[];
  onChange: (tagIds: ItemTagIdDto[]) => void;
};

export function ItemTagSelector({ label, selectedTagIds, onChange }: ItemTagSelectorProps) {
  const selected = new Set(selectedTagIds);

  const toggleTag = (tagId: ItemTagIdDto) => {
    const next = selected.has(tagId)
      ? selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId)
      : [...selectedTagIds, tagId];
    onChange(sortItemTagIds(next));
  };

  return (
    <fieldset className="grid gap-2 border-0 p-0">
      <legend className="px-0 text-sm font-medium text-slate-900">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {ITEM_TAGS.map((tag) => {
          const checked = selected.has(tag.id);
          return (
            <label
              key={tag.id}
              className={[
                "inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm font-medium transition-colors",
                checked
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
