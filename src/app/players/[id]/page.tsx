import { notFound } from "next/navigation";
import { Container } from "@mantine/core";
import { getPlayer } from "@/interactors/get-player";
import { PlayerDetail } from "@/components/player-detail";
import { DescriptionStatus } from "@/components/description-status";
import { NotFoundError } from "@/errors/app-error";
import type { Player } from "@/types/player";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;

  let player;
  try {
    player = await getPlayer(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

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
