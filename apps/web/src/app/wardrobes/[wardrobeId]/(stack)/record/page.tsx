import { RecordMethodScreen } from "@/components/app/screens/RecordMethodScreen";

type RecordMethodPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordMethodPage({ params }: RecordMethodPageProps) {
  const { wardrobeId } = await params;
  return <RecordMethodScreen wardrobeId={wardrobeId} />;
}
