import { TemplateCreateScreen } from "@/components/app/screens/TemplateCreateScreen";

type TemplateCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateCreatePage({ params }: TemplateCreatePageProps) {
  const { wardrobeId } = await params;
  return <TemplateCreateScreen wardrobeId={wardrobeId} />;
}
