"use client";
import type { WardrobeRegionResponseDto } from "@/api/schemas/region";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { HOME_STRINGS } from "@/features/home/strings";
import { useRegionDialog } from "@/features/home/useRegionDialog";
import { HomeDialog } from "./HomeDialog";
import { RegionSources } from "./WeatherSources";
export function RegionDialog({
  wardrobeId,
  current,
  onSaved,
  onClose,
}: {
  wardrobeId: string;
  current: WardrobeRegionResponseDto;
  onSaved: (region: WardrobeRegionResponseDto) => void;
  onClose: () => void;
}) {
  const {
    query,
    setQuery,
    result,
    selection,
    setSelection,
    searching,
    saving,
    error,
    search,
    save,
  } = useRegionDialog({ wardrobeId, current, onSaved, onClose });
  return (
    <HomeDialog
      title={HOME_STRINGS.dialogs.region.title}
      busy={saving}
      onClose={onClose}
    >
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label className="grid gap-1">
          {HOME_STRINGS.dialogs.region.labels.query}
          <input
            value={query}
            disabled={saving}
            className="min-w-0 rounded border p-2 text-base"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.nativeEvent.isComposing || event.keyCode === 229)
              )
                event.preventDefault();
            }}
          />
        </label>
        <button className="rounded border p-2" disabled={saving} type="submit">
          {HOME_STRINGS.dialogs.region.actions.search}
        </button>
      </form>
      {searching ? (
        <p role="status">{HOME_STRINGS.dialogs.region.messages.searching}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <fieldset disabled={saving} className="grid gap-2">
          <legend className="text-sm">
            {HOME_STRINGS.dialogs.region.labels.results}
          </legend>
          {result.items.length === 0 ? (
            <p>{HOME_STRINGS.dialogs.region.messages.empty}</p>
          ) : (
            result.items.map((item) => (
              <label
                key={item.regionId}
                className="flex gap-2 rounded border p-2"
              >
                <input
                  type="radio"
                  name="region"
                  value={item.regionId}
                  checked={selection === item.regionId}
                  onChange={() => setSelection(item.regionId)}
                />
                {item.label}
              </label>
            ))
          )}
          {result.hasMore ? (
            <p className="text-sm">
              {HOME_STRINGS.dialogs.region.messages.hasMore}
            </p>
          ) : null}
        </fieldset>
      ) : null}
      <RegionSources />
      <div className="flex flex-wrap justify-end gap-2">
        {current.region ? (
          <button
            type="button"
            className="rounded border p-2"
            disabled={saving}
            onClick={() => void save(true)}
          >
            {HOME_STRINGS.dialogs.region.actions.clear}
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving}
          className="rounded border p-2"
          onClick={onClose}
        >
          {COMMON_STRINGS.actions.cancel}
        </button>
        <button
          type="button"
          className="rounded bg-slate-900 p-2 text-white disabled:opacity-50"
          disabled={!selection || saving || searching}
          onClick={() => void save()}
        >
          {saving
            ? HOME_STRINGS.dialogs.region.actions.saving
            : HOME_STRINGS.dialogs.region.actions.save}
        </button>
      </div>
    </HomeDialog>
  );
}
