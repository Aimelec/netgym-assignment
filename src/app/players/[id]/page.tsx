import { notFound } from "next/navigation";
import { Container } from "@mantine/core";
import { prisma } from "@/lib/prisma";
import { PlayerDetail } from "@/components/player-detail";
import { DescriptionStatus } from "@/components/description-status";
import type { Player } from "@/types/player";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) notFound();

  return (
    <Container size="xl" py="xl">
      <PlayerDetail player={player as Player} />
      <DescriptionStatus
        playerId={player.id}
        initialDescription={player.description}
        initialStatus={player.descriptionStatus}
      />
    </Container>
  );
}
