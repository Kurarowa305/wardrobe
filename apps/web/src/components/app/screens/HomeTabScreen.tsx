"use client";
import Link from "next/link";
import { useConfirmation } from "@/features/record/useConfirmation";
import { RecordConfirmationDialog } from "@/components/app/home/RecordConfirmationDialog";
import { createElement, useEffect, useRef, useState } from "react";
import { useHome } from "@/api/hooks/home";
import { useWardrobeDetail } from "@/api/hooks/wardrobe";
import type { RecommendedTemplate } from "@/api/schemas/home";
import { RegionDialog } from "@/components/app/home/RegionDialog";
import { WeatherSources } from "@/components/app/home/WeatherSources";
import { RecommendationCard } from "@/components/app/home/RecommendationCard";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import { HOME_STRINGS } from "@/features/home/strings";
import { weatherLabel, temperatureLabel } from "@/features/home/presentation";
import {
  OPERATION_TOAST_IDS,
  consumeOperationToast,
} from "@/features/toast/operationToast";
type HomeTabScreenProps = {
  wardrobeId: string;
  /** #283 replaces the existing recording route with the confirmation dialog at this seam. */
  onRecordTemplate?: (item: RecommendedTemplate) => void;
};
const modes = HOME_STRINGS.labels.modes;
export function HomeTabScreen({
  wardrobeId,
  onRecordTemplate,
}: HomeTabScreenProps) {
  const { toast } = useToast();
  const confirmation = useConfirmation(wardrobeId, title => toast({ title }));
  const hasShownToastRef = useRef(false);
  const wardrobeQuery = useWardrobeDetail(wardrobeId);
  const home = useHome(wardrobeId);
  const [regionOpen, setRegionOpen] = useState(false);
  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") {
      return;
    }

    const { toastId, nextSearch } = consumeOperationToast(
      window.location.search,
    );

    if (toastId === OPERATION_TOAST_IDS.wardrobeCreated) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.wardrobeCreated.title });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${nextSearch}`,
      );
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.historyCreated) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.historyCreated.title });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${nextSearch}`,
      );
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.historyDeleted) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.historyDeleted.title });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${nextSearch}`,
      );
    }
  }, [toast, wardrobeId]);

  const weather = home.weather.data;
  const recommendations = home.recommendations.data;
  const content = (
    <div className="grid gap-4">
      <section
        aria-label={HOME_STRINGS.labels.weather}
        className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="min-w-0 truncate text-left font-semibold underline"
            disabled={!home.region.data}
            onClick={() => setRegionOpen(true)}
          >
            {home.region.data?.region?.label ??
              HOME_STRINGS.dialogs.region.title}
          </button>
          <time className="shrink-0 text-xs text-slate-600">
            {home.targetDate}
          </time>
        </div>
        {home.region.status === "error" ? (
          <p role="alert">
            {HOME_STRINGS.messages.regionFailed}
            <button className="underline" onClick={() => void home.refresh()}>
              {HOME_STRINGS.actions.refresh}
            </button>
          </p>
        ) : null}
        {home.weather.status === "loading" ? (
          <p role="status">{HOME_STRINGS.messages.weatherLoading}</p>
        ) : home.weather.status === "error" ||
          weather?.status === "unavailable" ? (
          <p role="status">
            {HOME_STRINGS.messages.weatherFailed}
            <button
              type="button"
              className="underline"
              onClick={() => void home.retryWeather()}
            >
              {HOME_STRINGS.actions.retryWeather}
            </button>
          </p>
        ) : weather?.status === "region_required" ? (
          <p>{HOME_STRINGS.messages.weatherRegionRequired}</p>
        ) : weather?.status === "available" ? (
          <>
            <p>{weatherLabel(weather.daily.weatherCode)}</p>
            <p className="text-sm">
              {HOME_STRINGS.labels.temperatureRange(
                temperatureLabel(weather.daily.temperatureMax),
                temperatureLabel(weather.daily.temperatureMin),
              )}
            </p>
          </>
        ) : null}
        <WeatherSources />
      </section>
      <div
        className="grid grid-cols-5 gap-1"
        role="group"
        aria-label={HOME_STRINGS.labels.recommendationMode}
      >
        {modes.map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={home.mode === mode}
            onClick={() => void home.selectMode(mode)}
            className={`min-w-0 rounded-md border py-2 text-sm ${home.mode === mode ? "border-slate-900 bg-slate-900 font-semibold text-white" : "border-slate-300 bg-white text-slate-900"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <section
        className="grid gap-2"
        data-record-focus-fallback
        tabIndex={-1}
        aria-label={HOME_STRINGS.labels.recommendations}
        aria-live="polite"
        aria-busy={home.recommendations.status === "loading"}
      >
        <h2 className="text-sm font-semibold">
          {HOME_STRINGS.labels.recommendations}
        </h2>
        {home.recommendations.status === "loading" ? (
          <p>{HOME_STRINGS.messages.recommendationsLoading}</p>
        ) : home.recommendations.status === "error" ? (
          <p role="alert">
            {home.recorded
              ? HOME_STRINGS.messages.recordedRecommendationsFailed
              : HOME_STRINGS.messages.recommendationsFailed}
            <button
              type="button"
              className="underline"
              onClick={() => void home.retryRecommendations()}
            >
              {HOME_STRINGS.actions.retryRecommendations}
            </button>
          </p>
        ) : recommendations?.status === "region_required" ? (
          <p>{HOME_STRINGS.messages.regionRequired}</p>
        ) : recommendations?.status === "weather_required" ? (
          <p>{HOME_STRINGS.messages.weatherRequired}</p>
        ) : recommendations?.status === "empty" ? (
          <p>{HOME_STRINGS.messages.recommendationsEmpty}</p>
        ) : recommendations?.status === "ready" ? (
          <>
            <ul className="m-0 grid list-none gap-2 p-0">
              {recommendations.items.slice(0, 3).map((item) => (
                <li key={item.templateId}>
                  <RecommendationCard
                    item={item}
                    onClick={() =>
                      onRecordTemplate
                        ? onRecordTemplate(item)
                        : confirmation.open(item)
                    }
                  />
                </li>
              ))}
            </ul>
            {recommendations.items.length < 3 ? (
              <p className="text-sm text-slate-600">
                {HOME_STRINGS.messages.recommendationsShort(
                  recommendations.items.length,
                )}
              </p>
            ) : null}
          </>
        ) : null}
        {recommendations &&
        (recommendations.status === "empty" ||
          (recommendations.status === "ready" &&
            recommendations.items.length < 3)) ? (
          <Link
            className="text-sm underline"
            href={ROUTES.templates(wardrobeId)}
          >
            {HOME_STRINGS.actions.viewTemplates}
          </Link>
        ) : null}
      </section>
      <Button asChild variant="outline" className="w-full border bg-white">
        <Link href={ROUTES.recordMethod(wardrobeId)}>
          {HOME_STRINGS.actions.addRecord}
        </Link>
      </Button>
      <RecordConfirmationDialog snapshot={confirmation.snapshot} strings={confirmation.strings} onClose={confirmation.close} onDate={confirmation.setDate} onSubmit={() => void confirmation.submit()} onRefresh={() => void confirmation.refresh()} />
      {!confirmation.snapshot.open && confirmation.snapshot.message === "storage" ? <p role="alert">{confirmation.strings.messages.storage}</p> : null}
      {regionOpen && home.region.data ? (
        <RegionDialog
          key={wardrobeId}
          wardrobeId={wardrobeId}
          current={home.region.data}
          onSaved={(region) => void home.regionSaved(region)}
          onClose={() => setRegionOpen(false)}
        />
      ) : null}
    </div>
  );
  return createElement(AppLayout, {
    title: wardrobeQuery.data?.name ?? "",
    tabKey: "home",
    wardrobeId,
    children: content,
  });
}
