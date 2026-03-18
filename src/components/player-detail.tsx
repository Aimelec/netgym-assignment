import { SimpleGrid, Card, Text, Group, Badge, Anchor } from "@mantine/core";
import { formatFloat, formatStat } from "@/utils/format";
import type { Player } from "@/types/player";

interface Props {
  player: Player;
}

export function PlayerDetail({ player }: Props) {
  const stats = [
    { label: "Position", value: player.position },
    { label: "Games", value: formatStat(player.games) },
    { label: "At Bats", value: formatStat(player.atBat) },
    { label: "Runs", value: formatStat(player.runs) },
    { label: "Hits", value: formatStat(player.hits) },
    { label: "Doubles", value: formatStat(player.doubles) },
    { label: "Triples", value: formatStat(player.triples) },
    { label: "Home Runs", value: formatStat(player.homeRuns) },
    { label: "RBI", value: formatStat(player.rbi) },
    { label: "Walks", value: formatStat(player.walks) },
    { label: "Strikeouts", value: formatStat(player.strikeouts) },
    { label: "Stolen Bases", value: formatStat(player.stolenBases) },
    { label: "Caught Stealing", value: formatStat(player.caughtStealing) },
    { label: "Batting Avg", value: formatFloat(player.battingAvg) },
    { label: "OBP", value: formatFloat(player.obp) },
    { label: "SLG", value: formatFloat(player.slg) },
    { label: "OPS", value: formatFloat(player.ops) },
  ];

  return (
    <>
      <Group mb="lg" justify="space-between" align="center">
        <Group gap="sm">
          <Text size="xl" fw={700}>
            {player.playerName}
          </Text>
          <Badge size="lg" variant="light">
            {player.position}
          </Badge>
        </Group>
        <Group gap="md">
          <Anchor href={`/players/${player.id}/edit`} size="sm">
            Edit
          </Anchor>
          <Anchor href="/players" size="sm">
            Back to players
          </Anchor>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
        {stats.map(({ label, value }) => (
          <Card key={label} withBorder padding="sm">
            <Text size="xs" c="dimmed">
              {label}
            </Text>
            <Text size="lg" fw={600}>
              {value}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </>
  );
}
