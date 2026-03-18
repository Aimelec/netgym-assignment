"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Player } from "@/types/player";

export function useEditPlayer(player: Player) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: Record<string, unknown>) {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to update player");
      }

      router.push(`/players/${player.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return { error, submitting, handleSubmit };
}
