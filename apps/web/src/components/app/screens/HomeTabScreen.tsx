"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { OPERATION_TOAST_IDS, consumeOperationToast } from "@/features/toast/operationToast";
type HomeTabScreenProps = {
  wardrobeId: string;
  /** #283 replaces the existing recording route with the confirmation dialog at this seam. */
  onRecordTemplate?: (item: RecommendedTemplate) => void;
};
const modes = [["auto","自動"],["spring","春"],["summer","夏"],["autumn","秋"],["winter","冬"]] as const;
export function HomeTabScreen({ wardrobeId, onRecordTemplate }: HomeTabScreenProps) {
  const { toast } = useToast();
  const router = useRouter();
  const hasShownToastRef = useRef(false);
  const wardrobeQuery = useWardrobeDetail(wardrobeId);
  const home = useHome(wardrobeId);
  const [regionOpen,setRegionOpen]=useState(false);
  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") {
      return;
    }

    const { toastId, nextSearch } = consumeOperationToast(window.location.search);

    if (toastId === OPERATION_TOAST_IDS.wardrobeCreated) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.wardrobeCreated.title });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.historyCreated) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.historyCreated.title });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.historyDeleted) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.historyDeleted.title });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
    }
  }, [toast, wardrobeId]);


  const weather=home.weather.data;
  const recommendations=home.recommendations.data;
  const content = <div className="grid gap-4">
    <section aria-label="今日の天気" className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2"><button type="button" className="min-w-0 truncate text-left font-semibold underline" disabled={!home.region.data} onClick={()=>setRegionOpen(true)}>{home.region.data?.region?.label ?? "地域を設定"}</button><time className="shrink-0 text-xs text-slate-600">{home.targetDate}</time></div>
      {home.region.status==="error" ? <p role="alert">地域を取得できませんでした。<button className="underline" onClick={()=>void home.refresh()}>再読み込み</button></p> : null}
      {home.weather.status==="loading" ? <p role="status">天気を取得中</p> : home.weather.status==="error" || weather?.status==="unavailable" ? <p role="status">天気を取得できませんでした。季節を選んでおすすめを表示できます。<button type="button" className="underline" onClick={()=>void home.retryWeather()}>天気を再取得</button></p> : weather?.status==="region_required" ? <p>地域を設定すると今日の天気と自動のおすすめを表示できます。</p> : weather?.status==="available" ? <><p>{weatherLabel(weather.daily.weatherCode)}</p><p className="text-sm">最高 {temperatureLabel(weather.daily.temperatureMax)} / 最低 {temperatureLabel(weather.daily.temperatureMin)}</p></> : null}
      <WeatherSources/>
    </section>
    <div className="grid grid-cols-5 gap-1" role="group" aria-label="推薦モード">{modes.map(([mode,label])=><button key={mode} type="button" aria-pressed={home.mode===mode} onClick={()=>void home.selectMode(mode)} className={`min-w-0 rounded-md border py-2 text-sm ${home.mode===mode ? "border-slate-900 bg-slate-900 font-semibold text-white" : "border-slate-300 bg-white text-slate-900"}`}>{label}</button>)}</div>
    <section className="grid gap-2" aria-label="おすすめテンプレート" aria-live="polite" aria-busy={home.recommendations.status==="loading"}>
      <h2 className="text-sm font-semibold">おすすめテンプレート</h2>
      {home.recommendations.status==="loading" ? <p>おすすめを取得中</p> : home.recommendations.status==="error" ? <p role="alert">{home.recorded ? "記録しました。おすすめの更新に失敗しました。" : "おすすめの取得に失敗しました。"}<button type="button" className="underline" onClick={()=>void home.retryRecommendations()}>おすすめを再取得</button></p> : recommendations?.status==="region_required" ? <p>地域を設定するか、季節を選んでください。</p> : recommendations?.status==="weather_required" ? <p>自動判定に必要な天気情報がありません。季節を選んでください。</p> : recommendations?.status==="empty" ? <p>おすすめできるテンプレートがありません。</p> : recommendations?.status==="ready" ? <><ul className="m-0 grid list-none gap-2 p-0">{recommendations.items.slice(0,3).map(item=><li key={item.templateId}><RecommendationCard item={item} onClick={()=>onRecordTemplate ? onRecordTemplate(item) : router.push(ROUTES.recordByTemplate(wardrobeId))}/></li>)}</ul>{recommendations.items.length<3 ? <p className="text-sm text-slate-600">おすすめは{recommendations.items.length}件です。別の季節を選ぶか、テンプレートを追加できます。</p> : null}</> : null}
      {recommendations && (recommendations.status==="empty" || (recommendations.status==="ready" && recommendations.items.length<3)) ? <Link className="text-sm underline" href={ROUTES.templates(wardrobeId)}>テンプレート一覧へ</Link> : null}
    </section>
    <Button asChild variant="outline" className="w-full border bg-white"><Link href={ROUTES.recordMethod(wardrobeId)}>+ その他から記録</Link></Button>
    {regionOpen && home.region.data ? <RegionDialog wardrobeId={wardrobeId} current={home.region.data} onSaved={region=>void home.regionSaved(region)} onClose={()=>setRegionOpen(false)}/> : null}
  </div>;
  return createElement(AppLayout, { title: wardrobeQuery.data?.name ?? "", tabKey: "home", wardrobeId, children: content });
}
