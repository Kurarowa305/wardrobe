import { HomeTabScreen } from "@/components/app/screens/HomeTabScreen";

type HomePageProps = {
  params: Promise<{ wardrobeId: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { wardrobeId } = await params;
  const { created } = await searchParams;
  return <HomeTabScreen wardrobeId={wardrobeId} showCreatedToast={created === "1"} />;
}
