import { TemplatesTabScreen } from "@/components/app/screens/TemplatesTabScreen";

type TemplateListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateListPage({ params }: TemplateListPageProps) {
  const { wardrobeId } = await params;
  return <TemplatesTabScreen wardrobeId={wardrobeId} />;
}
