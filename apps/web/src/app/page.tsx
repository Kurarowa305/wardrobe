import Link from 'next/link';
import { AppShell } from '@/components/app/layout/AppShell';
import { routes, SAMPLE_WARDROBE_ID } from '@/constants/routes';

export default function CreateWardrobePage() {
  return (
    <AppShell title="ワードローブ作成">
      <p>画面No.1: ワードローブ作成</p>
      <p>仮実装として、作成ボタンからホームへ遷移します。</p>
      <Link className="button-link" href={routes.home(SAMPLE_WARDROBE_ID)}>
        作成してホームへ
      </Link>
    </AppShell>
  );
}
