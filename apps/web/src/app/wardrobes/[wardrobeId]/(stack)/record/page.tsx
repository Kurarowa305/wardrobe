import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";

type RecordMethodPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordMethodPage({ params }: RecordMethodPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="記録"
      backHref={ROUTES.home(wardrobeId)}
      description="記録方法選択（スタック）。"
      links={[
        { label: "テンプレートで記録", href: ROUTES.recordByTemplate(wardrobeId) },
        { label: "服の組み合わせで記録", href: ROUTES.recordByCombination(wardrobeId) },
      ]}
    />
  );
}
