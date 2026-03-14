"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type WardrobeCreateFormProps = {
  successHref: string;
};

const HOME_TOAST_QUERY_KEY = "toast";
const HOME_TOAST_QUERY_VALUE = "wardrobe-created";

export function WardrobeCreateForm({ successHref }: WardrobeCreateFormProps) {
  const [name, setName] = useState("");
  const { error } = useToast();

  const onSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      error("ワードローブ名を入力してください");
      return;
    }

    const nextUrl = new URL(successHref, window.location.origin);
    nextUrl.searchParams.set(HOME_TOAST_QUERY_KEY, HOME_TOAST_QUERY_VALUE);
    window.location.href = nextUrl.toString();
  };

  return (
    <div className="screen-form">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="ワードローブ名"
        aria-label="ワードローブ名"
      />
      <Button onClick={onSubmit} type="button">
        作成
      </Button>
    </div>
  );
}
