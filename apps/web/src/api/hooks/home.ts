"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getWeather, getTemplateRecommendations } from "@/api/endpoints/home";
import { getWardrobeRegion } from "@/api/endpoints/region";
import type { RecommendationMode } from "@/api/schemas/home";
import type { WardrobeRegionResponseDto } from "@/api/schemas/region";
import { HomeController, jstDate, nextJstMidnight, type HomeSnapshot } from "@/features/home/controller";

export function useHome(wardrobeId: string) {
  const client=useQueryClient();
  const controller=useRef<HomeController | null>(null);
  const [snapshot,setSnapshot]=useState<HomeSnapshot>({mode:"auto",targetDate:jstDate(),region:{status:"loading"},weather:{status:"loading"},recommendations:{status:"loading"},recorded:false});
  useEffect(()=>{
    const home=new HomeController(client,wardrobeId,{region:getWardrobeRegion,weather:getWeather,recommendations:getTemplateRecommendations});
    controller.current=home;
    const unsubscribe=home.subscribe(()=>setSnapshot(home.getSnapshot()));
    void home.enter();
    let timer: ReturnType<typeof setTimeout>;
    const schedule=()=>{ clearTimeout(timer); timer=setTimeout(()=>{void home.enter();schedule();},Math.max(1,nextJstMidnight()-Date.now())); };
    let wasHidden=document.visibilityState==="hidden";
    const resume=()=>{ if(document.visibilityState==="hidden") {wasHidden=true;return;} if(wasHidden) {wasHidden=false;void home.enter();schedule();} };
    const pageshow=(event: PageTransitionEvent)=>{if(event.persisted) {void home.enter();schedule();}};
    schedule(); document.addEventListener("visibilitychange",resume); window.addEventListener("pageshow",pageshow);
    return ()=>{clearTimeout(timer);document.removeEventListener("visibilitychange",resume);window.removeEventListener("pageshow",pageshow);unsubscribe();home.dispose();controller.current=null;};
  },[client,wardrobeId]);
  return { ...snapshot,
    selectMode:(mode:RecommendationMode)=>controller.current?.selectMode(mode),
    refresh:()=>controller.current?.enter(),
    regionSaved:(region:WardrobeRegionResponseDto)=>controller.current?.regionSaved(region),
    retryWeather:()=>controller.current?.retryWeather(),
    retryRecommendations:()=>controller.current?.retryRecommendations(),
  };
}
