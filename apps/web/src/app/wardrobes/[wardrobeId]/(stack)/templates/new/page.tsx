import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";

type TemplateCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateCreatePage({ params }: TemplateCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="テンプレートの追加"
      backHref={ROUTES.templates(wardrobeId)}
      description="テンプレート追加（スタック）。"
      links={[{ label: "追加完了して一覧へ", href: ROUTES.templates(wardrobeId) }]}
    />
  );
}
