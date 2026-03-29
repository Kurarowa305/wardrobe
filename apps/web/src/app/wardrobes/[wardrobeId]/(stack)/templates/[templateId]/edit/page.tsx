import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
