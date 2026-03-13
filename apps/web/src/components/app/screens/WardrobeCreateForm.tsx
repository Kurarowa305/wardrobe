"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type WardrobeCreateFormProps = {
  successHref: string;
};

export function WardrobeCreateForm({ successHref }: WardrobeCreateFormProps) {
  const [name, setName] = useState("");
  const { error, showToast } = useToast();

  const onSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      error("ワードローブ名を入力してください");
      return;
    }

    showToast("ワードローブを作成しました（モック）");
    window.location.href = successHref;
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
