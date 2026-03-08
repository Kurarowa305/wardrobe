import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";

type RecordByTemplatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByTemplatePage({ params }: RecordByTemplatePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="テンプレートで記録"
      backHref={ROUTES.recordMethod(wardrobeId)}
      description="記録（テンプレートで記録）画面。"
      links={[{ label: "記録完了してホームへ", href: ROUTES.home(wardrobeId) }]}
    />
  );
}
