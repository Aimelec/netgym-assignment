import { notFound } from "next/navigation";
import { Container, Title } from "@mantine/core";
import { getPlayer } from "@/interactors/get-player";
import { EditPlayerForm } from "@/components/edit-player-form";
import { NotFoundError } from "@/errors/app-error";
import type { Player } from "@/types/player";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPlayerPage({ params }: Props) {
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
      <Title order={1} mb="lg">
        Edit {player.playerName}
      </Title>
      <EditPlayerForm player={player as Player} />
    </Container>
  );
}
