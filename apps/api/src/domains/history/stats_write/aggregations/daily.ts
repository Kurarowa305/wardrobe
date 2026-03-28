import type { HistoryFact, HistoryStatsWriteCommand, StatsWriteTargetFact, WearDailyFact } from "../types.js";

export type LastWornAtUpdatePlan =
  | {
    mode: "max";
    epochMs: number;
  }
  | {
    mode: "recompute";
  };

export type DailyStatsCacheUpdateFact = {
  wardrobeId: string;
  target: StatsWriteTargetFact;
  wearCountDelta: 1 | -1;
  lastWornAt: LastWornAtUpdatePlan;
};

const DATE_PATTERN = /^\d{8}$/;

const toEpochMsFromCompactDate = (date: string): number => {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Invalid yyyymmdd date: ${date}`);
  }

  const year = Number.parseInt(date.slice(0, 4), 10);
  const month = Number.parseInt(date.slice(4, 6), 10);
  const day = Number.parseInt(date.slice(6, 8), 10);

  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
};

const normalizeHistoryTargets = (history: HistoryFact): StatsWriteTargetFact[] => {
  const uniqueClothingIds = [...new Set(history.clothingIds)];
  const clothingTargets = uniqueClothingIds.map((clothingId) => ({
    kind: "clothing" as const,
    id: clothingId,
  }));

  if (history.templateId === null) {
    return clothingTargets;
  }

  return [{ kind: "template", id: history.templateId }, ...clothingTargets];
};

const resolveDailyCountDelta = (mode: HistoryStatsWriteCommand["mode"]): 1 | -1 => {
  return mode === "create" ? 1 : -1;
};

export const resolveDailyStatsTargets = (command: HistoryStatsWriteCommand): StatsWriteTargetFact[] => {
  return normalizeHistoryTargets(command.history);
};

export const buildWearDailyFacts = (command: HistoryStatsWriteCommand): WearDailyFact[] => {
  const targets = resolveDailyStatsTargets(command);
  const countDelta = resolveDailyCountDelta(command.mode);

  return targets.map((target) => ({
    wardrobeId: command.history.wardrobeId,
    target,
    date: command.history.date,
    count: countDelta,
  }));
};

export const buildDailyStatsCacheUpdateFacts = (
  command: HistoryStatsWriteCommand,
): DailyStatsCacheUpdateFact[] => {
  const targets = resolveDailyStatsTargets(command);
  const wearCountDelta = resolveDailyCountDelta(command.mode);
  const createLastWornAtEpochMs = toEpochMsFromCompactDate(command.history.date);

  return targets.map((target) => ({
    wardrobeId: command.history.wardrobeId,
    target,
    wearCountDelta,
    lastWornAt: command.mode === "create"
      ? {
        mode: "max",
        epochMs: createLastWornAtEpochMs,
      }
      : {
        mode: "recompute",
      },
  }));
};
