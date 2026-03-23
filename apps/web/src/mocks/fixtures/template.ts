import type {
  TemplateDetailClothingItemDto,
  TemplateDetailResponseDto,
  TemplateListResponseDto,
  TemplateStatusDto,
} from "@/api/schemas/template";
import { CLOTHING_FIXTURE_WARDROBE_ID, clothingDetailFixtureById } from "@/mocks/fixtures/clothing";

export const TEMPLATE_FIXTURE_WARDROBE_ID = CLOTHING_FIXTURE_WARDROBE_ID;
const GENERATED_TEMPLATE_FIXTURE_COUNT = 31;
const GENERATED_TEMPLATE_FIXTURE_BASE_TIMESTAMP = 1735620000000;

export type TemplateDetailFixture = TemplateDetailResponseDto & { templateId: string };

type TemplateDetailFixtureSeed = {
  templateId: string;
  name: string;
  status: TemplateStatusDto;
  wearCount: number;
  lastWornAt: number;
  clothingIds: string[];
};

function createGeneratedClothingId(prefix: "top" | "bottom" | "other", sequence: number) {
  return `cl_${prefix}_auto_${String(sequence).padStart(3, "0")}`;
}

const templateDetailFixtureSeeds: TemplateDetailFixtureSeed[] = [
  {
    templateId: "tp_01HZZBBB",
    name: "普段着",
    status: "ACTIVE",
    wearCount: 8,
    lastWornAt: 1735600000000,
    clothingIds: ["cl_top_001", "cl_bottom_001", "cl_other_001", createGeneratedClothingId("top", 1), createGeneratedClothingId("bottom", 1)],
  },
  {
    templateId: "tp_01HZZBBC",
    name: "週末コーデ",
    status: "ACTIVE",
    wearCount: 3,
    lastWornAt: 1735610000000,
    clothingIds: ["cl_top_002", "cl_bottom_002", createGeneratedClothingId("other", 2)],
  },
  {
    templateId: "tp_01HZZBBD",
    name: "冬の外出",
    status: "DELETED",
    wearCount: 1,
    lastWornAt: 1735500000000,
    clothingIds: ["cl_top_003", "cl_bottom_003", "cl_other_003"],
  },
  ...Array.from({ length: GENERATED_TEMPLATE_FIXTURE_COUNT }, (_, index): TemplateDetailFixtureSeed => {
    const sequence = index + 1;
    const padded = String(sequence).padStart(3, "0");
    const wearCount = (sequence * 2) % 15;
    const status: TemplateStatusDto = sequence % 10 === 0 ? "DELETED" : "ACTIVE";

    return {
      templateId: `tp_auto_${padded}`,
      name: `fixtureテンプレ${padded}`,
      status,
      wearCount,
      lastWornAt: wearCount === 0 ? 0 : GENERATED_TEMPLATE_FIXTURE_BASE_TIMESTAMP + sequence * 10_000,
      clothingIds: [
        createGeneratedClothingId("top", ((sequence - 1) % 12) + 1),
        createGeneratedClothingId("bottom", ((sequence + 3 - 1) % 12) + 1),
        createGeneratedClothingId("other", ((sequence + 6 - 1) % 12) + 1),
      ],
    };
  }),
];

function toTemplateClothingItem(clothingId: string): TemplateDetailClothingItemDto {
  const clothingFixture = clothingDetailFixtureById[clothingId];
  if (!clothingFixture) {
    throw new Error(`Missing clothing fixture for template fixture: ${clothingId}`);
  }
  return { ...clothingFixture };
}

export const templateDetailFixtures: TemplateDetailFixture[] = templateDetailFixtureSeeds.map((seed) => ({
  templateId: seed.templateId,
  name: seed.name,
  status: seed.status,
  wearCount: seed.wearCount,
  lastWornAt: seed.lastWornAt,
  clothingItems: seed.clothingIds.map(toTemplateClothingItem),
}));

export const templateListFixture: TemplateListResponseDto = {
  items: templateDetailFixtures
    .filter((fixture) => fixture.status === "ACTIVE")
    .map((fixture) => ({
      templateId: fixture.templateId,
      name: fixture.name,
      clothingItems: fixture.clothingItems.map((clothingItem) => ({
        clothingId: clothingItem.clothingId,
        imageKey: clothingItem.imageKey,
        status: clothingItem.status,
      })),
    })),
  nextCursor: null,
};

export const templateDetailFixtureById = templateDetailFixtures.reduce<Record<string, TemplateDetailFixture>>(
  (accumulator, fixture) => {
    accumulator[fixture.templateId] = fixture;
    return accumulator;
  },
  {},
);
