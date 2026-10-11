import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import type { HomeContext, RecommendationMode, TemplateRecommendationsDto, WeatherResponseDto } from "@/api/schemas/home";
import type { WardrobeRegionResponseDto } from "@/api/schemas/region";
import { subscribeRecommendations } from "./invalidation";

export function jstDate(now = new Date()) { return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10); }
export function nextJstMidnight(now = new Date()) { return Date.parse(`${jstDate(now)}T00:00:00+09:00`) + 86400000; }
type Result<T> = { status: "loading" | "error" | "success"; data?: T };
export type HomeSnapshot = { mode: RecommendationMode; targetDate: string; region: Result<WardrobeRegionResponseDto>; weather: Result<WeatherResponseDto>; recommendations: Result<TemplateRecommendationsDto>; recorded: boolean };
export type HomeApi = {
  region: (wardrobeId: string, signal?: AbortSignal) => Promise<WardrobeRegionResponseDto>;
  weather: (context: HomeContext, signal?: AbortSignal) => Promise<WeatherResponseDto>;
  recommendations: (context: HomeContext, mode: RecommendationMode, signal?: AbortSignal) => Promise<TemplateRecommendationsDto>;
};
const controlledQueries = { retry: 0, gcTime: 86400000, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchInterval: false } as const;

/** The public screen actions own request generations; query cache only owns reusable data. */
export class HomeController {
  private snapshot: HomeSnapshot;
  private listeners = new Set<() => void>();
  private generation = 0;
  private weatherGeneration = 0;
  private regionGeneration = 0;
  private stopped = false;
  private recoveryContext = "";
  private unsubscribe: () => void;
  constructor(private client: QueryClient, private wardrobeId: string, private api: HomeApi, private now: () => Date = () => new Date()) {
    this.snapshot = {mode:"auto",targetDate:jstDate(now()),region:{status:"loading"},weather:{status:"loading"},recommendations:{status:"loading"},recorded:false};
    this.unsubscribe = subscribeRecommendations(client, wardrobeId, (phase, recordCreated) => {
      if (phase === "cancel") {
        this.generation++;
        this.update({recommendations:{status:"loading"}, ...(recordCreated ? {mode:"auto" as const,recorded:true} : {})});
      } else { void this.loadRecommendations(); }
    });
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(patch: Partial<HomeSnapshot>) { if (this.stopped) return; this.snapshot = {...this.snapshot,...patch}; this.listeners.forEach(listener=>listener()); }
  private context(): HomeContext | undefined { const region=this.snapshot.region.data; return region ? {wardrobeId:this.wardrobeId,regionRevision:region.revision,targetDate:this.snapshot.targetDate} : undefined; }
  private isCurrent(context: HomeContext) {
    if (jstDate(this.now()) !== this.snapshot.targetDate) { void this.enter(); return false; }
    const current = this.context();
    return !this.stopped && current?.regionRevision===context.regionRevision && current.targetDate===context.targetDate;
  }
  private matches(actual: HomeContext, expected: HomeContext) { return actual.wardrobeId===expected.wardrobeId && actual.regionRevision===expected.regionRevision && actual.targetDate===expected.targetDate; }
  private async recover(error: unknown) {
    const reason = (error as {details?:{reason?:string}})?.details?.reason;
    const context = JSON.stringify(this.context());
    if (this.recoveryContext !== context && (reason === "REGION_CHANGED" || reason === "TARGET_DATE_CHANGED")) {
      this.recoveryContext=context;
      await this.enter();
      return true;
    }
    return false;
  }
  async enter() {
    const generation=++this.regionGeneration;
    this.generation++; this.weatherGeneration++;
    this.update({mode:"auto",targetDate:jstDate(this.now()),region:{status:"loading"},weather:{status:"loading"},recommendations:{status:"loading"}});
    await Promise.all([
      this.client.cancelQueries({queryKey:queryKeys.wardrobe.region(this.wardrobeId)}),
      this.client.cancelQueries({queryKey:queryKeys.template.recommendations(this.wardrobeId)}),
      this.client.cancelQueries({queryKey:["weather",this.wardrobeId]}),
    ]);
    if (generation!==this.regionGeneration || this.stopped) return;
    try {
      const region=await this.client.fetchQuery({...controlledQueries,queryKey:queryKeys.wardrobe.region(this.wardrobeId),queryFn:({signal})=>this.api.region(this.wardrobeId,signal),staleTime:0});
      if (generation!==this.regionGeneration || this.stopped) return;
      this.update({region:{status:"success",data:region}});
      void this.loadWeather(); void this.loadRecommendations();
    } catch { if (generation===this.regionGeneration) this.update({region:{status:"error"},weather:{status:"error"},recommendations:{status:"error"}}); }
  }
  async regionSaved(region: WardrobeRegionResponseDto) {
    this.regionGeneration++; this.generation++; this.weatherGeneration++;
    this.client.setQueryData(queryKeys.wardrobe.region(this.wardrobeId),region);
    this.update({mode:"auto",targetDate:jstDate(this.now()),region:{status:"success",data:region},weather:{status:"loading"},recommendations:{status:"loading"}});
    await Promise.all([this.client.cancelQueries({queryKey:["weather",this.wardrobeId]}),this.client.cancelQueries({queryKey:queryKeys.template.recommendations(this.wardrobeId)})]);
    void this.loadWeather(); void this.loadRecommendations();
  }
  async selectMode(mode: RecommendationMode) {
    if (jstDate(this.now())!==this.snapshot.targetDate) { await this.enter(); return; }
    this.generation++;
    this.update({mode,recommendations:{status:"loading"},recorded:false});
    await this.client.cancelQueries({queryKey:queryKeys.template.recommendations(this.wardrobeId)});
    void this.loadRecommendations();
  }
  async retryWeather() { this.recoveryContext=""; await this.loadWeather(); }
  async retryRecommendations() { this.recoveryContext=""; await this.loadRecommendations(); }
  async loadWeather() {
    const context=this.context(); if (!context || !this.isCurrent(context)) return;
    const generation=++this.weatherGeneration;
    this.update({weather:{status:"loading"}});
    const queryKey=queryKeys.weather.detail(this.wardrobeId,context.regionRevision,context.targetDate);
    const cached=this.client.getQueryData<WeatherResponseDto>(queryKey);
    // Only a successful day's forecast is reusable; unavailable responses remain explicitly retryable.
    const valid=cached?.status==="available" && Date.parse(cached.expiresAt)>this.now().getTime();
    try {
      const data=valid ? cached : await this.client.fetchQuery({...controlledQueries,queryKey,staleTime:0,queryFn:({signal})=>this.api.weather(context,signal)});
      if (generation!==this.weatherGeneration || !this.isCurrent(context)) return;
      if (!this.matches(data,context)) throw new Error("Weather context mismatch");
      this.update({weather:{status:"success",data}});
    } catch(error) { if(generation===this.weatherGeneration && this.isCurrent(context) && !await this.recover(error)) this.update({weather:{status:"error"}}); }
  }
  async loadRecommendations() {
    const context=this.context(); if (!context || !this.isCurrent(context)) return;
    const generation=++this.generation; const mode=this.snapshot.mode;
    this.update({recommendations:{status:"loading"}});
    try {
      const data=await this.client.fetchQuery({...controlledQueries,queryKey:queryKeys.template.recommendation(this.wardrobeId,mode,context.regionRevision,context.targetDate),staleTime:0,queryFn:({signal})=>this.api.recommendations(context,mode,signal)});
      if (generation!==this.generation || !this.isCurrent(context)) return;
      if (!this.matches(data,context) || data.mode!==mode) throw new Error("Recommendation context mismatch");
      this.update({recommendations:{status:"success",data}});
    } catch(error) { if(generation===this.generation && this.isCurrent(context) && !await this.recover(error)) this.update({recommendations:{status:"error"}}); }
  }
  dispose() { this.stopped=true; this.generation++; this.regionGeneration++; this.weatherGeneration++; this.unsubscribe(); this.listeners.clear();
    void this.client.cancelQueries({queryKey:queryKeys.wardrobe.region(this.wardrobeId)});
    void this.client.cancelQueries({queryKey:["weather",this.wardrobeId]});
    void this.client.cancelQueries({queryKey:queryKeys.template.recommendations(this.wardrobeId)}); }
}
