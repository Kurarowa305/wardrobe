import type { ClothingDetailResponseDto, ClothingListResponseDto } from "@/api/schemas/clothing";

export const CLOTHING_FIXTURE_WARDROBE_ID = "wd_01HZZ8ABCDEF1234567890";
const GENERATED_CLOTHING_FIXTURE_COUNT = 47;
const GENERATED_CLOTHING_FIXTURE_BASE_TIMESTAMP = 1735590000000;

export const clothingDetailFixtures: ClothingDetailResponseDto[] = [
  {
    clothingId: "cl_01HZZAAA",
    name: "黒Tシャツ",
    imageKey: "clothing/black_t.png",
    status: "ACTIVE",
    wearCount: 12,
    lastWornAt: 1735690000123,
  },
  {
    clothingId: "cl_01HZZAAB",
    name: "白シャツ",
    imageKey: null,
    status: "ACTIVE",
    wearCount: 0,
    lastWornAt: 0,
  },
  {
    clothingId: "cl_01HZZAAC",
    name: "デニムジャケット",
    imageKey: "clothing/denim_jacket.png",
    status: "DELETED",
    wearCount: 4,
    lastWornAt: 1735600000456,
  },
  ...Array.from({ length: GENERATED_CLOTHING_FIXTURE_COUNT }, (_, index): ClothingDetailResponseDto => {
    const sequence = index + 1;
    const padded = String(sequence).padStart(3, "0");
    const wearCount = (sequence * 3) % 21;
    const hasImage = sequence % 3 !== 0;
    const isDeleted = sequence % 13 === 0;

    return {
      clothingId: `cl_auto_${padded}`,
      name: `fixture服${padded}`,
      imageKey: hasImage ? `clothing/fixture_${padded}.png` : null,
      status: isDeleted ? "DELETED" : "ACTIVE",
      wearCount,
      lastWornAt:
        wearCount === 0 ? 0 : GENERATED_CLOTHING_FIXTURE_BASE_TIMESTAMP + sequence * 10_000,
    };
  }),
];

export const clothingListFixture: ClothingListResponseDto = {
  items: clothingDetailFixtures
    .filter((fixture) => fixture.status === "ACTIVE")
    .map((fixture) => ({
      clothingId: fixture.clothingId,
      name: fixture.name,
      imageKey: fixture.imageKey,
    })),
  nextCursor: null,
};

export const clothingDetailFixtureById = clothingDetailFixtures.reduce<Record<string, ClothingDetailResponseDto>>(
  (accumulator, fixture) => {
    accumulator[fixture.clothingId] = fixture;
    return accumulator;
  },
  {},
);
