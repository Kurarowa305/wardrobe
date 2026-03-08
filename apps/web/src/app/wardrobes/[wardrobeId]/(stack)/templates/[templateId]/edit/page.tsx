import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";
import { DEMO_IDS } from "@/constants/routes";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return [{ templateId: DEMO_IDS.template }];
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
