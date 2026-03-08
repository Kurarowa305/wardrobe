import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

type TemplateListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateListPage({ params }: TemplateListPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="テンプレート"
      tabKey="templates"
      wardrobeId={wardrobeId}
      description="テンプレート一覧（タブ）。戻るは表示しません。"
      links={[
        { label: "＋ テンプレートを追加", href: ROUTES.templateNew(wardrobeId) },
        { label: "テンプレート詳細へ", href: ROUTES.templateDetail(wardrobeId, DEMO_IDS.template) },
      ]}
    />
  );
}
