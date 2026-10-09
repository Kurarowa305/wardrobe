"use client";

// THROWAWAY #277: Three weather/dialog layouts on /home?variant=A|B|C.
// Existing card geometry and approved actions stay fixed. All data and writes are in memory.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./prototype.css";

type Variant = "A" | "B" | "C";
type Mode = "自動" | "春" | "夏" | "秋" | "冬";
type Status = "ready" | "loading" | "error";
type Template = { id: number; name: string; colors: string[]; count: number };
const modes: Mode[] = ["自動", "春", "夏", "秋", "冬"];
const variants: Variant[] = ["A", "B", "C"];
const names = { A: "コンパクト・中央ダイアログ", B: "気温を左右に・下から開く", C: "予報を大きく・縦長ダイアログ" };
const templates: Template[] = [
  { id: 1, name: "白シャツとネイビーのパンツ", colors: ["#e6e7e3", "#334357", "#9a8571"], count: 3 },
  { id: 2, name: "ボーダーとベージュの休日コーデ", colors: ["#697e83", "#d1bc99", "#5c5b59", "#ab8367"], count: 6 },
  { id: 3, name: "朝夕の冷え込みにも対応できるお気に入りの重ね着テンプレート", colors: ["#adb5a0", "#f0e9da", "#626a6b", "#88725d"], count: 20 },
];
const regions = ["東京都 府中市", "広島県 府中市", "東京都 新宿区", "大阪府 大阪市", "北海道 札幌市", "沖縄県 那覇市"];
function today() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key)?.value).join("-");
}
function TemplateContent({ item }: { item: Template }) {
  return <>
    <span className="truncate text-sm font-medium text-slate-900" title={item.name}>{item.name}</span>
    <span className="grid grid-cols-5 gap-2">
      {item.colors.slice(0, 4).map((color, index) => <span key={index} className="relative block aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        <svg viewBox="0 0 80 80" role="img" aria-label={`構成服 ${index + 1}`} className="h-full w-full p-1">
          {index === 1 ? <path d="M23 10h34l-3 62H40l-2-40-2 40H22z" fill={color} stroke="#64748b" strokeWidth="1" /> : <path d="m25 12 10-4q5 8 10 0l10 4 17 20-12 10-8-9v36H28V33l-8 9L8 32z" fill={color} stroke="#64748b" strokeWidth="1" />}
        </svg>
      </span>)}
      {item.count > 4 && <span className="flex aspect-square items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700" aria-label={`ほか${item.count - 4}着`}>+{item.count - 4}</span>}
    </span>
  </>;
}
const cardClass = "grid w-full min-w-0 gap-3 rounded-md border border-slate-300 bg-white p-3 text-left";

function Modal({ title, hideTitle = false, variant, busy = false, close, children }: { title: string; hideTitle?: boolean; variant: Variant; busy?: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus(); else document.getElementById("recommendation-title")?.focus(); };
  }, []);
  return <dialog ref={ref} className={`prototype-dialog dialog-${variant}`} aria-labelledby="prototype-dialog-title" aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <h2 id="prototype-dialog-title" className={hideTitle ? "sr-only" : "m-0 mb-5 text-lg font-semibold"}>{title}</h2>
    {children}
  </dialog>;
}

export function HomePrototype({ initialVariant }: { initialVariant: string }) {
  const router = useRouter();
  const variant: Variant = variants.includes(initialVariant as Variant) ? initialVariant as Variant : "A";
  const [mode, setMode] = useState<Mode>("自動");
  const [region, setRegion] = useState<string | null>("東京都 府中市");
  const [weather, setWeather] = useState<Status>("ready");
  const [cached, setCached] = useState(false);
  const [recommendation, setRecommendation] = useState<Status>("ready");
  const [count, setCount] = useState(3);
  const [offset, setOffset] = useState(0);
  const [modal, setModal] = useState<"record" | "region" | "controls" | null>(null);
  const [chosen, setChosen] = useState<Template>(templates[0]);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [results, setResults] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchOutcome, setSearchOutcome] = useState("success");
  const [regionOutcome, setRegionOutcome] = useState("success");
  const [recordOutcome, setRecordOutcome] = useState("success");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const searchVersion = useRef(0);
  const recommendationVersion = useRef(0);
  function later(fn: () => void, ms = 900) { timers.current.push(setTimeout(fn, ms)); }
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    console.info("[prototype #277 state]", { variant, mode, region, weather, cached, recommendation, count, recordDate: date, selectedTemplate: chosen.name, searchOutcome, regionOutcome, recordOutcome });
  }, [variant, mode, region, weather, cached, recommendation, count, date, chosen, searchOutcome, regionOutcome, recordOutcome]);
  const hasWeather = !!region && (weather === "ready" || cached);
  const canRecommend = mode !== "自動" || hasWeather;
  const waitingForWeather = mode === "自動" && !!region && weather === "loading" && !cached;
  function switchVariant(direction: number) {
    const next = variants[(variants.indexOf(variant) + direction + variants.length) % variants.length];
    router.replace(`/home?variant=${next}`, { scroll: false });
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (modal || (event.target instanceof Element && event.target.closest("input,textarea,select,button,a,[contenteditable=true],[role=radio]"))) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); switchVariant(event.key === "ArrowRight" ? 1 : -1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  function chooseMode(next: Mode) {
    setMode(next); setRecommendation("loading");
    const version = ++recommendationVersion.current;
    later(() => { if (version === recommendationVersion.current) setRecommendation("ready"); });
  }
  function close() { if (!busy) { searchVersion.current++; setModal(null); setFormError(""); } }
  function openRegion() { setFormError(""); setQuery(""); setSelectedRegion(""); setResults([]); setSearchStatus("idle"); setModal("region"); }
  function search() {
    if (!query.trim()) return;
    const version = ++searchVersion.current;
    const term = query.trim(); setSelectedRegion(""); setSearchStatus("loading"); setResults([]); setFormError("");
    later(() => {
      if (version !== searchVersion.current) return;
      setSearchStatus(searchOutcome === "error" ? "error" : "ready");
      setResults(searchOutcome === "success" ? regions.filter(r => r.includes(term)) : []);
    });
  }
  function saveRegion() {
    setBusy(true); setFormError("");
    later(() => {
      setBusy(false);
      if (regionOutcome === "error") { setFormError("地域を設定できませんでした。選択内容を確認して、もう一度お試しください。"); return; }
      setRegion(selectedRegion); setCached(false); setWeather("loading"); setModal(null); setNotice("地域を変更しました");
      if (mode === "自動") setRecommendation("loading");
      later(() => { setWeather("ready"); setRecommendation("ready"); });
    });
  }
  function record() {
    if (!date) { setFormError("日付を入力してください。"); return; }
    setBusy(true); setFormError("");
    later(() => {
      setBusy(false);
      if (recordOutcome === "error") { setFormError("記録できませんでした。日付を確認して、もう一度お試しください。"); return; }
      setModal(null); setNotice(`${date.replaceAll("-", "/")}の着用を記録しました`); setRecommendation("loading");
      later(() => { setOffset(value => (value + 1) % 3); setRecommendation(recordOutcome === "refresh-error" ? "error" : "ready"); });
    });
  }
  const regionButton = <button type="button" className="min-h-11 text-left text-sm underline underline-offset-4" onClick={openRegion}>{region ?? "地域を設定"} <span aria-hidden="true">›</span></button>;
  const temperature = <><span className="text-xl font-semibold">24°</span><span className="ml-2 text-sm text-slate-500">最高</span><span className="ml-5 text-xl font-semibold">17°</span><span className="ml-2 text-sm text-slate-500">最低</span></>;
  const weatherBody = !region ? <p>地域を設定すると、天気に合わせておすすめします。季節を選んで使うこともできます。</p>
    : weather === "loading" && !cached ? <p role="status">天気を取得中</p>
    : weather === "error" && !cached ? <p role="status">天気を取得できませんでした。季節を選んでおすすめを表示できます。</p>
    : <>
      {variant === "A" && <div className="flex flex-wrap items-center justify-between gap-2"><span>☀ 晴れ</span><div>{temperature}</div></div>}
      {variant === "B" && <><p className="my-2 text-center">☀ 晴れ</p><div className="grid grid-cols-2 divide-x divide-slate-200 text-center"><div><p className="m-0 text-xs text-slate-500">最高気温</p><strong className="text-3xl">24°</strong></div><div><p className="m-0 text-xs text-slate-500">最低気温</p><strong className="text-3xl">17°</strong></div></div></>}
      {variant === "C" && <div className="grid grid-cols-[64px_1fr] items-center gap-3 py-3"><span className="text-5xl" aria-hidden="true">☀</span><div><p className="m-0 mb-2 text-lg font-medium">晴れ</p><div>{temperature}</div></div></div>}
      {weather === "error" && cached && <p className="mt-2 text-xs text-slate-600">更新できなかったため、当日取得済みの予報を表示しています。</p>}
    </>;
  return <div className="home-prototype" data-variant={variant}>
    <div className="prototype-banner">UI試作 · 架空データ · 操作は保存されません</div>
    <div onClickCapture={event => { const target = event.target as Element; if (target.closest(".tab-bar a")) { event.preventDefault(); setNotice("試作ではタブ移動を省略しています。"); } }}>
      <AppLayout title="わたしのワードローブ" tabKey="home" wardrobeId="prototype">
        <div className="grid gap-5 pb-16">
          {notice && <div role="status" className="flex items-start justify-between gap-2 rounded-md bg-slate-100 p-3 text-sm"><span>{notice}</span><button aria-label="通知を閉じる" onClick={() => setNotice("")} className="min-h-8 min-w-8">×</button></div>}
          <section aria-label="今日の天気" className={`weather-${variant} text-sm`}>
            <div className="flex items-center justify-between gap-2">{regionButton}<span className="text-xs text-slate-500">{today().slice(5).replace("-", "/")}</span></div>
            {weatherBody}
          </section>
          <div className="grid grid-cols-5 gap-1" role="group" aria-label="おすすめの季節">
            {modes.map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => chooseMode(value)} className={`min-h-11 rounded-md border px-1 text-sm font-medium ${mode === value ? "border-slate-700 bg-[var(--primary)] text-white" : "border-slate-300 bg-white text-slate-700"}`}>{value}</button>)}
          </div>
          <section aria-labelledby="recommendation-title" className="grid gap-3">
            <h2 id="recommendation-title" tabIndex={-1} className="m-0 text-sm font-semibold">おすすめテンプレート</h2>
            {waitingForWeather ? <p role="status" className="text-sm text-slate-600">天気の取得後におすすめを表示します。</p> : !canRecommend ? <p className="text-sm text-slate-600">春・夏・秋・冬を選ぶと、おすすめを表示できます。</p> : recommendation === "loading" ? <p role="status" className="text-sm text-slate-600">おすすめを取得中</p> : recommendation === "error" ? <p role="alert" className="text-sm text-red-700">おすすめを取得できませんでした。モードを選び直すか、時間をおいてホームを開いてください。</p> : count === 0 ? <div className="grid gap-3 text-sm"><p>おすすめできるテンプレートがありません</p><p className="text-slate-600">季節を切り替えるか、季節タグ付きのテンプレートを追加してください。</p><Button variant="outline" onClick={() => setNotice("試作ではテンプレート追加画面への移動を省略しています。")}>テンプレートを追加</Button></div> : <ul className="m-0 grid list-none gap-3 p-0">{Array.from({ length: count }, (_, i) => templates[(i + offset) % 3]).map(item => <li key={item.id}><button type="button" className={`${cardClass} transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500`} aria-label={`${item.name}の着用を記録`} onClick={() => { setChosen(item); setDate(today()); setFormError(""); setModal("record"); }}><TemplateContent item={item} /></button></li>)}</ul>}
          </section>
          <Button variant="outline" size="lg" className="w-full justify-start" onClick={() => setNotice("既存の記録方法選択画面へ進みます（試作では移動を省略）。")}>+ その他から記録</Button>
        </div>
      </AppLayout>
    </div>
    {process.env.NODE_ENV !== "production" && <aside className="prototype-switcher" aria-label="試作の比較"><button aria-label="前の案" onClick={() => switchVariant(-1)}>←</button><span title={names[variant]}>{variant} · {variant === "A" ? "コンパクト" : variant === "B" ? "左右の気温" : "予報を大きく"}</span><button aria-label="次の案" onClick={() => switchVariant(1)}>→</button><button onClick={() => setModal("controls")}>検証</button></aside>}
    {modal === "record" && <Modal title="着用を記録" hideTitle variant={variant} busy={busy} close={close}>
      <form onSubmit={event => { event.preventDefault(); record(); }} className="grid gap-5">
        <fieldset disabled={busy} className="m-0 grid min-w-0 gap-5 border-0 p-0">
          <div className="grid gap-2"><label htmlFor="record-date" className="text-sm font-medium">日付</label><Input id="record-date" type="date" value={date} onChange={event => setDate(event.target.value)} required aria-describedby={formError ? "record-error" : undefined} /></div>
          <div className={cardClass} aria-label="記録するテンプレート"><TemplateContent item={chosen} /></div>
        </fieldset>
        {formError && <p id="record-error" role="alert" className="text-sm text-red-700">{formError}</p>}
        <div className="prototype-actions grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={busy} onClick={close}>キャンセル</Button><Button type="submit" disabled={busy}>{busy ? "記録中…" : "記録する"}</Button></div>
        <span className="sr-only" role="status">{busy ? "記録中です" : ""}</span>
      </form>
    </Modal>}
    {modal === "region" && <Modal title="地域を設定" variant={variant} busy={busy} close={close}>
      <div className="grid gap-4">
        <p className="m-0 text-sm text-slate-600">現在の地域：{region ?? "未設定"}</p>
        <form onSubmit={event => { event.preventDefault(); search(); }} className="grid gap-2">
          <label htmlFor="region-search" className="text-sm font-medium">市区町村名</label>
          <div className="flex gap-2"><Input id="region-search" placeholder="例：府中" value={query} disabled={busy} onKeyDown={event => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} onChange={event => { searchVersion.current++; setQuery(event.target.value); setSelectedRegion(""); setResults([]); setSearchStatus("idle"); }} /><Button type="submit" variant="outline" disabled={busy || !query.trim() || searchStatus === "loading"}>検索</Button></div>
        </form>
        <div role="status" className="text-sm">{searchStatus === "loading" ? "地域を検索中…" : searchStatus === "error" ? "検索できませんでした。時間をおいて検索してください。" : searchStatus === "ready" ? results.length ? `${results.length}件の候補があります` : "該当する地域がありません。市区町村名を変えて検索してください。" : "市区町村名を入力して検索してください。"}</div>
        {!!results.length && <fieldset disabled={busy} className="grid gap-2 border-0 p-0"><legend className="sr-only">地域の候補</legend>{results.map(value => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${selectedRegion === value ? "border-slate-700 bg-slate-100" : "border-slate-300"}`}><input type="radio" name="region" value={value} checked={selectedRegion === value} onChange={() => setSelectedRegion(value)} />{value}</label>)}</fieldset>}
        {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
        <a href="https://www.qweather.com" target="_blank" rel="noreferrer" className="text-xs text-slate-500 underline">地域情報：QWeather</a>
        <div className="prototype-actions grid grid-cols-2 gap-2"><Button variant="outline" disabled={busy} onClick={close}>キャンセル</Button><Button disabled={busy || !selectedRegion} onClick={saveRegion}>{busy ? "設定中…" : "この地域に設定"}</Button></div>
      </div>
    </Modal>}
    {modal === "controls" && <Modal title="試作の検証パネル" variant="C" close={close}>
      <div className="grid gap-4 text-sm">
        <p className="m-0 text-slate-600">{names[variant]}。架空の検索候補は「府中」「新宿」「大阪」「札幌」「那覇」。このパネルの設定後、キャンセルでホームに戻って操作します。</p>
        <label className="grid gap-1">地域<select aria-label="地域" value={region ?? ""} onChange={event => setRegion(event.target.value || null)}><option value={region ?? "東京都 府中市"}>{region ?? "東京都 府中市"}</option><option value="">未設定</option></select></label>
        <label className="grid gap-1">天気<select aria-label="天気" value={cached && weather === "error" ? "cached" : weather} onChange={event => { setCached(event.target.value === "cached"); setWeather(event.target.value === "cached" ? "error" : event.target.value as Status); }}><option value="ready">取得成功</option><option value="loading">取得中</option><option value="error">失敗・当日キャッシュなし</option><option value="cached">失敗・当日キャッシュあり</option></select></label>
        <label className="grid gap-1">推薦<select aria-label="推薦" value={recommendation} onChange={event => { recommendationVersion.current++; setRecommendation(event.target.value as Status); }}><option value="ready">取得成功</option><option value="loading">取得中</option><option value="error">取得失敗</option></select></label>
        <label className="grid gap-1">候補数<select aria-label="候補数" value={count} onChange={event => setCount(Number(event.target.value))}>{[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}件</option>)}</select></label>
        <label className="grid gap-1">地域検索の結果<select aria-label="地域検索の結果" value={searchOutcome} onChange={event => setSearchOutcome(event.target.value)}><option value="success">成功（入力文字に一致）</option><option value="empty">候補なし</option><option value="error">通信失敗</option></select></label>
        <label className="grid gap-1">地域保存の結果<select aria-label="地域保存の結果" value={regionOutcome} onChange={event => setRegionOutcome(event.target.value)}><option value="success">成功</option><option value="error">保存失敗</option></select></label>
        <label className="grid gap-1">記録の結果<select aria-label="記録の結果" value={recordOutcome} onChange={event => setRecordOutcome(event.target.value)}><option value="success">成功</option><option value="error">保存失敗が確定</option><option value="refresh-error">記録成功・推薦再取得失敗</option></select></label>
        <details><summary>現在の状態</summary><pre className="overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-2 text-xs">{JSON.stringify({ variant, mode, region, weather, cached, recommendation, count, recordDate: date, selectedTemplate: chosen.name, searchOutcome, regionOutcome, recordOutcome }, null, 2)}</pre></details>
        <Button variant="outline" onClick={close}>キャンセル</Button>
      </div>
    </Modal>}
  </div>;
}
