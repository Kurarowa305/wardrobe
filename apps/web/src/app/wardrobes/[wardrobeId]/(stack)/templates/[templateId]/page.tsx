import { TemplateDetailScreen } from "@/components/app/screens/TemplateDetailScreen";
import { DEMO_IDS } from "@/constants/routes";

type TemplateDetailPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return [{ templateId: DEMO_IDS.template }];
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateDetailScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
