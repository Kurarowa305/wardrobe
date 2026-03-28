export type StatsWriteMode = "create" | "delete";

export type StatsWriteTargetKind = "clothing" | "template";

export type HistoryFact = {
  wardrobeId: string;
  historyId: string;
  date: string;
  templateId: string | null;
  clothingIds: string[];
  createdAt: number;
};

export type HistoryStatsWriteCommand = {
  mode: StatsWriteMode;
  history: HistoryFact;
};

export type StatsWriteTargetFact = {
  kind: StatsWriteTargetKind;
  id: string;
};

export type WearDailyFact = {
  wardrobeId: string;
  target: StatsWriteTargetFact;
  date: string;
  count: number;
};
