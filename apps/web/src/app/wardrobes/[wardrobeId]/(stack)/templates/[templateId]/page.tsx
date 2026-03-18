import { TemplateDetailScreen } from "@/components/app/screens/TemplateDetailScreen";
import { DEMO_IDS } from "@/constants/routes";
import { templateDetailFixtures } from "@/mocks/fixtures/template";

type TemplateDetailPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return templateDetailFixtures.map((fixture) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    templateId: fixture.templateId,
  }));
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateDetailScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
