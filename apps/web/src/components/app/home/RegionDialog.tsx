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
      setError("地域名を1〜64文字で入力してください。");
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
        setError("地域の検索に失敗しました。もう一度検索してください。");
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
              `地域が変更されました（現在: ${latest.region?.label ?? "未設定"}）。選択を確認してもう一度設定してください。`,
            );
          }
        } catch {
          if (mounted.current)
            setError(
              "現在の地域を確認できません。閉じて再読み込みしてください。",
            );
        }
      } else if (reason === "REGION_DATASET_CHANGED")
        setError(
          "地域データが更新されました。もう一度検索して選択してください。",
        );
      else
        setError(
          "地域の保存に失敗しました。選択内容を確認して再度設定してください。",
        );
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  return (
    <HomeDialog title="地域を設定" busy={saving} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label className="grid gap-1">
          市区町村名
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
          検索
        </button>
      </form>
      {searching ? <p role="status">地域を検索中</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <fieldset disabled={saving} className="grid gap-2">
          <legend className="text-sm">検索結果</legend>
          {result.items.length === 0 ? (
            <p>該当する地域がありません。</p>
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
              候補がほかにもあります。地域名を詳しく入力してください。
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
            地域設定を解除
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving}
          className="rounded border p-2"
          onClick={onClose}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="rounded bg-slate-900 p-2 text-white disabled:opacity-50"
          disabled={!selection || saving || searching}
          onClick={() => void save()}
        >
          {saving ? "設定中…" : "この地域に設定"}
        </button>
      </div>
    </HomeDialog>
  );
}
