"use client";

import { Table, Pagination, Group, Select, Text, Anchor, Box } from "@mantine/core";
import { usePlayersTable } from "@/hooks/use-players-table";
import { formatFloat, formatStat } from "@/utils/format";
import type { Player } from "@/types/player";

interface Props {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
}

export function PlayersTable({
  players,
  total,
  page,
  totalPages,
  sortBy,
  sortOrder,
}: Props) {
  const { isPending, updateParams } = usePlayersTable();

  return (
    <Box opacity={isPending ? 0.6 : 1}>
      <Group mb="md" justify="space-between">
        <Text size="sm" c="dimmed">
          {total} players total
        </Text>
        <Group>
          <Select
            label="Sort by"
            size="xs"
            value={sortBy}
            data={[
              { value: "playerName", label: "Name" },
              { value: "hits", label: "Hits" },
              { value: "homeRuns", label: "Home Runs" },
            ]}
            onChange={(value) => value && updateParams({ sortBy: value, page: "1" })}
          />
          <Select
            label="Order"
            size="xs"
            value={sortOrder}
            data={[
              { value: "asc", label: "Ascending" },
              { value: "desc", label: "Descending" },
            ]}
            onChange={(value) => value && updateParams({ sortOrder: value, page: "1" })}
          />
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Position</Table.Th>
            <Table.Th>Games</Table.Th>
            <Table.Th>Hits</Table.Th>
            <Table.Th>Home Runs</Table.Th>
            <Table.Th>Batting Avg</Table.Th>
            <Table.Th>OPS</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {players.map((player) => (
            <Table.Tr key={player.id}>
              <Table.Td>
                <Anchor href={`/players/${player.id}`} size="sm">
                  {player.playerName}
                </Anchor>
              </Table.Td>
              <Table.Td>{player.position}</Table.Td>
              <Table.Td>{formatStat(player.games)}</Table.Td>
              <Table.Td>{formatStat(player.hits)}</Table.Td>
              <Table.Td>{formatStat(player.homeRuns)}</Table.Td>
              <Table.Td>{formatFloat(player.battingAvg)}</Table.Td>
              <Table.Td>{formatFloat(player.ops)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="center" mt="md">
        <Pagination
          total={totalPages}
          value={page}
          onChange={(p) => updateParams({ page: String(p) })}
        />
      </Group>
    </Box>
  );
}
