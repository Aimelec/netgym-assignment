import { notFound } from "next/navigation";
import { Container, Title } from "@mantine/core";
import { prisma } from "@/lib/prisma";
import { EditPlayerForm } from "@/components/edit-player-form";
import type { Player } from "@/types/player";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPlayerPage({ params }: Props) {
  const { id } = await params;

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) notFound();

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="lg">
        Edit {player.playerName}
      </Title>
      <EditPlayerForm player={player as Player} />
    </Container>
  );
}
