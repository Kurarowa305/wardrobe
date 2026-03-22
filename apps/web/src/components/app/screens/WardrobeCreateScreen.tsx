"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";

export function WardrobeCreateScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const trimmedName = name.trim();
  const isSubmitDisabled = trimmedName.length === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    router.push(`${ROUTES.home(DEMO_IDS.wardrobe)}?created=1`);
  };

  return (
    <AppLayout title={WARDROBE_STRINGS.create.title} showHeader={false}>
      <section className="grid gap-8 px-1 py-8">
        <div className="grid gap-3">
          <p className="m-0 text-3xl font-bold leading-tight text-[var(--primary)]">
            {WARDROBE_STRINGS.create.heroTitle}
          </p>
          <p className="m-0 text-sm text-slate-600">{WARDROBE_STRINGS.create.description}</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor="wardrobe-name" className="text-sm font-medium text-slate-700">
              {WARDROBE_STRINGS.create.labels.name}
            </label>
            <Input
              id="wardrobe-name"
              value={name}
              placeholder={WARDROBE_STRINGS.create.placeholders.name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {WARDROBE_STRINGS.create.actions.create}
          </Button>
        </form>
      </section>
    </AppLayout>
  );
}
