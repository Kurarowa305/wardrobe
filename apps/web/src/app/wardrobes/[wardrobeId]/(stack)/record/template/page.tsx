import { RecordByTemplateScreen } from "@/components/app/screens/RecordByTemplateScreen";

type RecordByTemplatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByTemplatePage({ params }: RecordByTemplatePageProps) {
  const { wardrobeId } = await params;
  return <RecordByTemplateScreen wardrobeId={wardrobeId} />;
}
