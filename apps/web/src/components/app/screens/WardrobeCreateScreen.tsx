"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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
    <AppLayout title={WARDROBE_STRINGS.create.title}>
      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    </AppLayout>
  );
}
