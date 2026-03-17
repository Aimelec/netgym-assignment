"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function usePlayersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    startTransition(() => {
      router.push(`/players?${params.toString()}`);
    });
  }

  return { isPending, updateParams };
}
