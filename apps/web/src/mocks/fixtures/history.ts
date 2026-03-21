import type {
  HistoryDetailClothingItemDto,
  HistoryDetailResponseDto,
  HistoryListItemDto,
  HistoryListResponseDto,
} from "@/api/schemas/history";
import { clothingDetailFixtureById } from "@/mocks/fixtures/clothing";
import {
  TEMPLATE_FIXTURE_WARDROBE_ID,
  templateDetailFixtureById,
} from "@/mocks/fixtures/template";

export const HISTORY_FIXTURE_WARDROBE_ID = TEMPLATE_FIXTURE_WARDROBE_ID;
const GENERATED_HISTORY_FIXTURE_COUNT = 17;

type HistoryDetailFixture = HistoryDetailResponseDto & {
  historyId: string;
};

type HistoryDetailFixtureSeed = {
  historyId: string;
  date: string;
  templateId: string | null;
  clothingIds: string[];
};

const historyDetailFixtureSeeds: HistoryDetailFixtureSeed[] = [
  {
    historyId: "hs_01HZZCCC",
    date: "20260321",
    templateId: "tp_01HZZBBB",
    clothingIds: [],
  },
  {
    historyId: "hs_01HZZCCD",
    date: "20260320",
    templateId: null,
    clothingIds: ["cl_01HZZAAB", "cl_auto_004", "cl_01HZZAAC"],
  },
  {
    historyId: "hs_01HZZCCE",
    date: "20260319",
    templateId: "tp_01HZZBBD",
    clothingIds: [],
  },
  {
    historyId: "hs_01HZZCCF",
    date: "20260318",
    templateId: null,
    clothingIds: ["cl_auto_001", "cl_auto_002", "cl_auto_003"],
  },
  {
    historyId: "hs_01HZZCCG",
    date: "20260317",
    templateId: "tp_auto_001",
    clothingIds: [],
  },
  {
    historyId: "hs_01HZZCCH",
    date: "20260316",
    templateId: null,
    clothingIds: ["cl_auto_005", "cl_auto_006", "cl_auto_007", "cl_auto_008", "cl_auto_009"],
  },
  {
    historyId: "hs_01HZZCCI",
    date: "20260315",
    templateId: "tp_auto_002",
    clothingIds: [],
  },
  ...Array.from({ length: GENERATED_HISTORY_FIXTURE_COUNT }, (_, index): HistoryDetailFixtureSeed => {
    const sequence = index + 1;
    const padded = String(sequence).padStart(3, "0");
    const useTemplate = sequence % 2 === 1;
    const firstClothingIndex = ((sequence - 1) % 47) + 1;
    const secondClothingIndex = ((sequence + 11 - 1) % 47) + 1;
    const thirdClothingIndex = ((sequence + 23 - 1) % 47) + 1;
    const templateId = useTemplate ? `tp_auto_${String(((sequence - 1) % 27) + 1).padStart(3, "0")}` : null;

    return {
      historyId: `hs_auto_${padded}`,
      date: `2025${String(((sequence - 1) % 12) + 1).padStart(2, "0")}${String(((sequence - 1) % 28) + 1).padStart(2, "0")}`,
      templateId,
      clothingIds: useTemplate
        ? []
        : [
            `cl_auto_${String(firstClothingIndex).padStart(3, "0")}`,
            sequence % 4 === 0 ? "cl_01HZZAAB" : `cl_auto_${String(secondClothingIndex).padStart(3, "0")}`,
            sequence % 6 === 0 ? "cl_01HZZAAC" : `cl_auto_${String(thirdClothingIndex).padStart(3, "0")}`,
          ],
    };
  }),
];

function toHistoryDetailClothingItem(clothingId: string): HistoryDetailClothingItemDto {
  const clothingFixture = clothingDetailFixtureById[clothingId];
  if (!clothingFixture) {
    throw new Error(`Missing clothing fixture for history fixture: ${clothingId}`);
  }

  return { ...clothingFixture };
}

export const historyDetailFixtures: HistoryDetailFixture[] = historyDetailFixtureSeeds.map((seed) => {
  if (seed.templateId !== null) {
    const templateFixture = templateDetailFixtureById[seed.templateId];
    if (!templateFixture) {
      throw new Error(`Missing template fixture for history fixture: ${seed.templateId}`);
    }

    return {
      historyId: seed.historyId,
      date: seed.date,
      templateName: templateFixture.name,
      clothingItems: templateFixture.clothingItems.map((clothingItem) => ({ ...clothingItem })),
    };
  }

  return {
    historyId: seed.historyId,
    date: seed.date,
    templateName: null,
    clothingItems: seed.clothingIds.map(toHistoryDetailClothingItem),
  };
});

export const historyListFixture: HistoryListResponseDto = {
  items: historyDetailFixtures.map(
    (fixture): HistoryListItemDto => ({
      historyId: fixture.historyId,
      date: fixture.date,
      name: fixture.templateName,
      clothingItems: fixture.clothingItems.map((clothingItem) => ({
        clothingId: clothingItem.clothingId,
        name: clothingItem.name,
        imageKey: clothingItem.imageKey,
        status: clothingItem.status,
      })),
    }),
  ),
  nextCursor: null,
};

export const historyDetailFixtureById = historyDetailFixtures.reduce<Record<string, HistoryDetailFixture>>(
  (accumulator, fixture) => {
    accumulator[fixture.historyId] = fixture;
    return accumulator;
  },
  {},
);
