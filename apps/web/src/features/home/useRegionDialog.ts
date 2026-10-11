"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getWardrobeRegion,
  saveWardrobeRegion,
  searchRegions,
} from "@/api/endpoints/region";
import { normalizeRegionSearch } from "@/api/schemas/region";
import type {
  RegionSearchResponseDto,
  WardrobeRegionResponseDto,
} from "@/api/schemas/region";
import { queryKeys } from "@/api/queryKeys";

import { HOME_STRINGS } from "./strings";
export function useRegionDialog({
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
  const client = useQueryClient();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RegionSearchResponseDto>();
  const [selection, setSelection] = useState<string>();
  const [revision, setRevision] = useState(current.revision);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const searchAbort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      searchAbort.current?.abort();
    };
  }, []);
  const search = async () => {
    const text = query.trim().normalize("NFKC");
    if ([...text].length === 0 || [...text].length > 64) {
      setError(HOME_STRINGS.dialogs.region.messages.invalidQuery);
      return;
    }
    const request = ++generation.current;
    searchAbort.current?.abort();
    searchAbort.current = new AbortController();
    setSearching(true);
    setError("");
    setResult(undefined);
    setSelection(undefined);
    try {
      const data = await searchRegions(text, searchAbort.current.signal);
      if (request !== generation.current || !mounted.current) return;
      const normalized = normalizeRegionSearch(text);
      client.setQueryData(
        queryKeys.regions.search(data.datasetVersion, normalized),
        data,
      );
      setResult(data);
    } catch {
      if (request === generation.current && mounted.current)
        setError(HOME_STRINGS.dialogs.region.messages.searchFailed);
    } finally {
      if (request === generation.current && mounted.current)
        setSearching(false);
    }
  };
  const save = async (clear = false) => {
    if (saving || (!clear && (!selection || !result))) return;
    setSaving(true);
    setError("");
    try {
      const response = await saveWardrobeRegion(
        wardrobeId,
        clear
          ? { regionId: null, expectedRevision: revision }
          : {
              regionId: selection!,
              datasetVersion: result!.datasetVersion,
              expectedRevision: revision,
            },
      );
      if (mounted.current) {
        onSaved(response);
        onClose();
      }
    } catch (error) {
      if (!mounted.current) return;
      const reason = (error as { details?: { reason?: string } })?.details
        ?.reason;
      if (reason === "REGION_CHANGED") {
        try {
          const latest = await getWardrobeRegion(wardrobeId);
          if (mounted.current) {
            setRevision(latest.revision);
            setError(
              HOME_STRINGS.dialogs.region.messages.regionChanged(
                latest.region?.label,
              ),
            );
          }
        } catch {
          if (mounted.current)
            setError(HOME_STRINGS.dialogs.region.messages.latestFailed);
        }
      } else if (reason === "UNKNOWN_REGION")
        setError(HOME_STRINGS.dialogs.region.messages.unknownRegion);
      else if (reason === "REGION_DATASET_CHANGED")
        setError(HOME_STRINGS.dialogs.region.messages.datasetChanged);
      else setError(HOME_STRINGS.dialogs.region.messages.saveFailed);
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  return {
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
  };
}
