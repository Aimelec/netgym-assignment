"use client";

import { Card, Text, Loader, Group, Stack, Alert } from "@mantine/core";
import { useDescriptionStream } from "@/hooks/use-description-stream";
import { renderMarkdown } from "@/utils/render-markdown";
import { DescriptionStatus as Status } from "@/types/player";

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
      {status === Status.READY && description ? (
        <Stack gap="xs">{renderMarkdown(description)}</Stack>
      ) : status === Status.FAILED ? (
        <Alert color="red" variant="light">
          Failed to generate description. Try editing the player to trigger a
          new generation.
        </Alert>
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
