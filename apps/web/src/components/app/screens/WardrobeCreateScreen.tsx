"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";

export function WardrobeCreateScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length === 0) {
      toast({
        variant: "destructive",
        title: WARDROBE_STRINGS.create.errors.nameRequired.title,
        description: WARDROBE_STRINGS.create.errors.nameRequired.message,
      });
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
          <Button type="submit" className="w-full">
            {WARDROBE_STRINGS.create.actions.create}
          </Button>
        </form>
      </section>
    </AppLayout>
  );
}
