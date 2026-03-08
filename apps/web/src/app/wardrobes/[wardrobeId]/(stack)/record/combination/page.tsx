import { RecordByCombinationScreen } from "@/components/app/screens/RecordByCombinationScreen";

type RecordByCombinationPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByCombinationPage({ params }: RecordByCombinationPageProps) {
  const { wardrobeId } = await params;
  return <RecordByCombinationScreen wardrobeId={wardrobeId} />;
}
