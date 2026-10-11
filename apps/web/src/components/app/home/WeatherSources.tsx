"use client";
import { HOME_STRINGS } from "@/features/home/strings";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { useState } from "react";
import { HomeDialog } from "./HomeDialog";
export function RegionSources() {
  return (
    <p className="text-xs text-slate-600">
      {HOME_STRINGS.dialogs.sources.labels.regionProvider}{" "}
      <a
        className="underline"
        href="https://www.digital.go.jp/policies/base_registry_address"
      >
        {HOME_STRINGS.dialogs.sources.labels.regionDataset}
      </a>
      (
      <a
        className="underline"
        href="https://www.digital.go.jp/policies/base_registry_address_tos"
      >
        {HOME_STRINGS.dialogs.sources.labels.regionTerms}
      </a>{" "}
      /{" "}
      <a
        className="underline"
        href="https://www.digital.go.jp/resources/open_data/public_data_license_v1.0"
      >
        {HOME_STRINGS.dialogs.sources.labels.regionLicense}
      </a>
      ) {HOME_STRINGS.dialogs.sources.messages.regionProcessing}
    </p>
  );
}
export function WeatherSources() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href="https://open-meteo.com/"
        aria-label={HOME_STRINGS.dialogs.sources.labels.trigger}
        aria-haspopup="dialog"
        className="ml-auto flex h-8 w-8 items-center justify-center text-sm"
        onClick={(event) => {
          if (
            event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        ⓘ
      </a>
      {open ? (
        <HomeDialog
          title={HOME_STRINGS.dialogs.sources.title}
          onClose={() => setOpen(false)}
        >
          <p className="text-sm">
            {HOME_STRINGS.dialogs.sources.labels.weatherData}{" "}
            <a className="underline" href="https://open-meteo.com/">
              {HOME_STRINGS.dialogs.sources.labels.weatherProvider}
            </a>{" "}
            /{" "}
            <a
              className="underline"
              href="https://creativecommons.org/licenses/by/4.0/"
            >
              {HOME_STRINGS.dialogs.sources.labels.weatherLicense}
            </a>
            {HOME_STRINGS.dialogs.sources.messages.forecast}
          </p>
          <p className="text-sm">
            {HOME_STRINGS.dialogs.sources.messages.weatherProcessing}
          </p>
          <RegionSources />
          <button
            type="button"
            className="rounded border p-2"
            onClick={() => setOpen(false)}
          >
            {COMMON_STRINGS.actions.close}
          </button>
        </HomeDialog>
      ) : null}
    </>
  );
}
