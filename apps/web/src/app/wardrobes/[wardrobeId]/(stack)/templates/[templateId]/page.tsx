import { TemplateDetailScreen } from "@/components/app/screens/TemplateDetailScreen";

type TemplateDetailPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateDetailScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
