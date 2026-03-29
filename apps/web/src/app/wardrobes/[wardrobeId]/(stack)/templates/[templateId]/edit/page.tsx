import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

const STATIC_EXPORT_WARDROBE_ID = "wd_static";
const STATIC_EXPORT_TEMPLATE_ID = "tp_static";

export function generateStaticParams() {
  return [
    {
      wardrobeId: STATIC_EXPORT_WARDROBE_ID,
      templateId: STATIC_EXPORT_TEMPLATE_ID,
    },
  ];
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
