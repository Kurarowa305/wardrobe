import { TemplateDetailScreen } from "@/components/app/screens/TemplateDetailScreen";

type TemplateDetailPageProps = {
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

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateDetailScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
