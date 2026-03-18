import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";
import { DEMO_IDS } from "@/constants/routes";
import { templateDetailFixtures } from "@/mocks/fixtures/template";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

const MOCK_TEMPLATE_ID_PREFIX = "tp_mock_";
const MOCK_TEMPLATE_STATIC_PARAMS_COUNT = 200;

function generateMockStaticTemplateIds() {
  return Array.from({ length: MOCK_TEMPLATE_STATIC_PARAMS_COUNT }, (_, index) => {
    const sequence = String(index + 1).padStart(4, "0");
    return `${MOCK_TEMPLATE_ID_PREFIX}${sequence}`;
  });
}

export function generateStaticParams() {
  const templateIds = new Set<string>([
    ...templateDetailFixtures.map((fixture) => fixture.templateId),
    ...generateMockStaticTemplateIds(),
  ]);

  return Array.from(templateIds).map((templateId) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    templateId,
  }));
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}
