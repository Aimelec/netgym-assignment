"use client";

import { useState, useEffect } from "react";

interface DescriptionState {
  description: string | null;
  status: string;
}

export function useDescriptionStream(
  playerId: string,
  initial: { description: string | null; status: string },
): DescriptionState {
  const [state, setState] = useState<DescriptionState>({
    description: initial.description,
    status: initial.status,
  });

  useEffect(() => {
    if (initial.status === "ready" && initial.description) return;

    const eventSource = new EventSource(
      `/api/players/${playerId}/description`,
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setState({ description: data.description, status: data.status });
      eventSource.close();
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [playerId, initial.status, initial.description]);

  return state;
}
