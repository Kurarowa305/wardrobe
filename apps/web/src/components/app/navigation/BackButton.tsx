"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
};

const BackButton = ({ fallbackHref = "/" }: BackButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-700"
    >
      ← 戻る
    </button>
  );
};

export default BackButton;
