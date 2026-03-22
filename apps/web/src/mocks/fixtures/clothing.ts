import type { ClothingDetailResponseDto, ClothingGenreDto, ClothingListResponseDto } from "@/api/schemas/clothing";

export const CLOTHING_FIXTURE_WARDROBE_ID = "wd_01HZZ8ABCDEF1234567890";
const GENERATED_FIXTURES_PER_GENRE = 12;
const GENERATED_CLOTHING_FIXTURE_BASE_TIMESTAMP = 1735590000000;
const FIXTURE_GENRE_ORDER = ["tops", "bottoms", "others"] as const satisfies readonly ClothingGenreDto[];

const CLOTHING_FIXTURE_SEEDS: Array<{
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
  status: ClothingDetailResponseDto["status"];
  wearCount: number;
  lastWornAt: number;
}> = [
  { clothingId: "cl_top_001", name: "黒Tシャツ", genre: "tops", imageKey: "clothing/black_t.png", status: "ACTIVE", wearCount: 12, lastWornAt: 1735690000123 },
  { clothingId: "cl_top_002", name: "白シャツ", genre: "tops", imageKey: null, status: "ACTIVE", wearCount: 0, lastWornAt: 0 },
  { clothingId: "cl_top_003", name: "デニムジャケット", genre: "tops", imageKey: "clothing/denim_jacket.png", status: "DELETED", wearCount: 4, lastWornAt: 1735600000456 },
  { clothingId: "cl_bottom_001", name: "ネイビースラックス", genre: "bottoms", imageKey: "clothing/navy_slacks.png", status: "ACTIVE", wearCount: 8, lastWornAt: 1735680000000 },
  { clothingId: "cl_bottom_002", name: "ブラックデニム", genre: "bottoms", imageKey: null, status: "ACTIVE", wearCount: 2, lastWornAt: 1735610000000 },
  { clothingId: "cl_bottom_003", name: "カーゴパンツ", genre: "bottoms", imageKey: "clothing/cargo_pants.png", status: "DELETED", wearCount: 5, lastWornAt: 1735620000000 },
  { clothingId: "cl_other_001", name: "グレーニット帽", genre: "others", imageKey: "clothing/gray_beanie.png", status: "ACTIVE", wearCount: 6, lastWornAt: 1735670000000 },
  { clothingId: "cl_other_002", name: "レザーベルト", genre: "others", imageKey: null, status: "ACTIVE", wearCount: 1, lastWornAt: 1735605000000 },
  { clothingId: "cl_other_003", name: "キャンバストート", genre: "others", imageKey: "clothing/canvas_tote.png", status: "DELETED", wearCount: 3, lastWornAt: 1735595000000 },
];

const GENERATED_CLOTHING_FIXTURE_COUNT = GENERATED_FIXTURES_PER_GENRE * FIXTURE_GENRE_ORDER.length;

function createGeneratedFixtures(): ClothingDetailResponseDto[] {
  return FIXTURE_GENRE_ORDER.flatMap((genre, genreIndex) =>
    Array.from({ length: GENERATED_FIXTURES_PER_GENRE }, (_, index): ClothingDetailResponseDto => {
      const sequence = index + 1;
      const padded = String(sequence).padStart(3, "0");
      const globalIndex = genreIndex * GENERATED_FIXTURES_PER_GENRE + sequence;
      const wearCount = (globalIndex * 3) % 21;
      const hasImage = sequence % 3 !== 0;
      const isDeleted = sequence === GENERATED_FIXTURES_PER_GENRE;
      const genreLabel = genre === "tops" ? "トップス" : genre === "bottoms" ? "ボトムス" : "その他";
      const prefix = genre === "tops" ? "top" : genre === "bottoms" ? "bottom" : "other";

      return {
        clothingId: `cl_${prefix}_auto_${padded}`,
        name: `${genreLabel}fixture${padded}`,
        genre,
        imageKey: hasImage ? `clothing/${prefix}_fixture_${padded}.png` : null,
        status: isDeleted ? "DELETED" : "ACTIVE",
        wearCount,
        lastWornAt: wearCount === 0 ? 0 : GENERATED_CLOTHING_FIXTURE_BASE_TIMESTAMP + globalIndex * 10_000,
      };
    }),
  );
}

export const clothingDetailFixtures: ClothingDetailResponseDto[] = [
  ...CLOTHING_FIXTURE_SEEDS,
  ...createGeneratedFixtures(),
];

export const clothingListFixture: ClothingListResponseDto = {
  items: clothingDetailFixtures
    .filter((fixture) => fixture.status === "ACTIVE")
    .map((fixture) => ({
      clothingId: fixture.clothingId,
      name: fixture.name,
      genre: fixture.genre,
      imageKey: fixture.imageKey,
    })),
};

export const clothingDetailFixtureById = clothingDetailFixtures.reduce<Record<string, ClothingDetailResponseDto>>(
  (accumulator, fixture) => {
    accumulator[fixture.clothingId] = fixture;
    return accumulator;
  },
  {},
);
