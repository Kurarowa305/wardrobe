import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";

type RecordByCombinationPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByCombinationPage({ params }: RecordByCombinationPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="服の組み合わせで記録"
      backHref={ROUTES.recordMethod(wardrobeId)}
      description="記録（服の組み合わせで記録）画面。"
      links={[{ label: "記録完了してホームへ", href: ROUTES.home(wardrobeId) }]}
    />
  );
}
