"use client";
import { useState } from "react";
import { HomeDialog } from "./HomeDialog";
export function RegionSources() {
  return <p className="text-xs text-slate-600">地域データ: デジタル庁 <a className="underline" href="https://www.digital.go.jp/policies/base_registry_address">アドレス・ベース・レジストリ</a>（<a className="underline" href="https://www.digital.go.jp/policies/base_registry_address_tos">利用規約</a> / <a className="underline" href="https://www.digital.go.jp/resources/open_data/public_data_license_v1.0">PDL1.0</a>）。全国市区町村マスター・位置参照拡張等をwardrobeが結合・検索用に加工しています。</p>;
}
export function WeatherSources() {
  const [open,setOpen]=useState(false);
  return <><a href="https://open-meteo.com/" aria-label="天気情報の出典（Open-Meteo）" aria-haspopup="dialog" className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border text-sm" onClick={event=>{if(event.button===0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {event.preventDefault();setOpen(true);}}}>ⓘ</a>{open ? <HomeDialog title="天気・地域情報の出典" onClose={()=>setOpen(false)}><p className="text-sm">天気データ: <a className="underline" href="https://open-meteo.com/">Open-Meteo</a> / <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>。当日のモデル予報を使用しています。</p><p className="text-sm">wardrobeによる加工: 市区町村の代表座標で予報を取得し、気温の表示を丸め、体感温度から独自指数とおすすめテンプレートを判定しています。最高実気温を代用する場合があります。提供元の公式服装指数ではありません。</p><RegionSources/><button type="button" className="rounded border p-2" onClick={()=>setOpen(false)}>閉じる</button></HomeDialog> : null}</>;
}
