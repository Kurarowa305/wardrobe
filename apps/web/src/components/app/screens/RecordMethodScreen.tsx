import Link from "next/link";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordMethodScreenProps = {
  wardrobeId: string;
};

export function RecordMethodScreen({ wardrobeId }: RecordMethodScreenProps) {
  return (
    <AppLayout title={RECORD_STRINGS.method.title} backHref={ROUTES.home(wardrobeId)}>
      <Card>
        <CardContent className="grid gap-2 p-4">
        <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.method.message}</p>
        <Button asChild variant="outline" className="w-full justify-start text-left text-sm font-medium">
          <Link href={ROUTES.recordByTemplate(wardrobeId)}>{RECORD_STRINGS.method.actions.byTemplate}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start text-left text-sm font-medium">
          <Link href={ROUTES.recordByCombination(wardrobeId)}>
            {RECORD_STRINGS.method.actions.byCombination}
          </Link>
        </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
