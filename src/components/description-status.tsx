"use client";

import { Card, Text, Loader, Group, Stack } from "@mantine/core";
import { useDescriptionStream } from "@/hooks/use-description-stream";
import { renderMarkdown } from "@/utils/render-markdown";

interface Props {
  playerId: string;
  initialDescription: string | null;
  initialStatus: string;
}

export function DescriptionStatus({
  playerId,
  initialDescription,
  initialStatus,
}: Props) {
  const { description, status } = useDescriptionStream(playerId, {
    description: initialDescription,
    status: initialStatus,
  });

  return (
    <Card withBorder mt="lg">
      <Text fw={600} mb="sm">
        Description (powered by Claude)
      </Text>
      {status === "ready" && description ? (
        <Stack gap="xs">{renderMarkdown(description)}</Stack>
      ) : (
        <Group gap="xs">
          <Loader size="xs" />
          <Text size="sm" c="dimmed">
            Generating description…
          </Text>
        </Group>
      )}
    </Card>
  );
}
