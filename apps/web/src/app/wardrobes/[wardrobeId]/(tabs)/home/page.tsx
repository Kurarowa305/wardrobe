import { HomeTabScreen } from "@/components/app/screens/HomeTabScreen";

type HomePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { wardrobeId } = await params;
  return <HomeTabScreen wardrobeId={wardrobeId} />;
}
