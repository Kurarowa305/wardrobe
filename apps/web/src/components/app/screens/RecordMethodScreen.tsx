"use client";

import Link from "next/link";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { TabBarIcon } from "@/components/ui/tab-bar-icon";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordMethodScreenProps = {
  wardrobeId: string;
};

export function RecordMethodScreen({ wardrobeId }: RecordMethodScreenProps) {
  return (
    <AppLayout title={RECORD_STRINGS.method.title} backHref={ROUTES.home(wardrobeId)}>
      <div className="grid gap-4">
        <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.method.message}</p>
        <Button
          asChild
          variant="outline"
          className="h-auto w-full justify-start rounded-2xl px-4 py-5 text-left"
        >
          <Link href={ROUTES.recordByTemplate(wardrobeId)} className="record-method-card">
            <TabBarIcon icon="templates" active={false} strokeColor="#000000" className="record-method-card-icon" />
            <span className="record-method-card-copy">
              <span className="text-sm font-medium">{RECORD_STRINGS.method.actions.byTemplate}</span>
              <span className="text-xs font-normal text-slate-600">{RECORD_STRINGS.method.descriptions.byTemplate}</span>
            </span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-auto w-full justify-start rounded-2xl px-4 py-5 text-left"
        >
          <Link href={ROUTES.recordByCombination(wardrobeId)} className="record-method-card">
            <TabBarIcon icon="clothings" active={false} strokeColor="#000000" className="record-method-card-icon" />
            <span className="record-method-card-copy">
              <span className="text-sm font-medium">{RECORD_STRINGS.method.actions.byCombination}</span>
              <span className="text-xs font-normal text-slate-600">
                {RECORD_STRINGS.method.descriptions.byCombination}
              </span>
            </span>
          </Link>
        </Button>
      </div>
    </AppLayout>
  );
}
