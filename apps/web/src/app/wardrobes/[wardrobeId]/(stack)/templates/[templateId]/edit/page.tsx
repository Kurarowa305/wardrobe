import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";
import { DEMO_IDS } from "@/constants/routes";
import { templateDetailFixtures } from "@/mocks/fixtures/template";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return templateDetailFixtures.map((fixture) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    templateId: fixture.templateId,
  }));
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
