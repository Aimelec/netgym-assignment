"use client";

import {
  TextInput,
  NumberInput,
  Select,
  Button,
  SimpleGrid,
  Group,
  Alert,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEditPlayer } from "@/hooks/use-edit-player";
import { POSITIONS } from "@/types/player";
import type { Player } from "@/types/player";

interface Props {
  player: Player;
}

export function EditPlayerForm({ player }: Props) {
  const { error, submitting, handleSubmit } = useEditPlayer(player);

  const form = useForm({
    initialValues: {
      playerName: player.playerName,
      position: player.position,
      games: player.games ?? 0,
      atBat: player.atBat ?? 0,
      runs: player.runs ?? 0,
      hits: player.hits ?? 0,
      doubles: player.doubles ?? 0,
      triples: player.triples ?? 0,
      homeRuns: player.homeRuns ?? 0,
      rbi: player.rbi ?? 0,
      walks: player.walks ?? 0,
      strikeouts: player.strikeouts ?? 0,
      stolenBases: player.stolenBases ?? 0,
      caughtStealing: player.caughtStealing ?? 0,
      battingAvg: player.battingAvg ?? 0,
      obp: player.obp ?? 0,
      slg: player.slg ?? 0,
      ops: player.ops ?? 0,
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
        <TextInput label="Name" required {...form.getInputProps("playerName")} />
        <Select label="Position" required data={[...POSITIONS]} allowDeselect={false} {...form.getInputProps("position")} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
        <NumberInput hideControls label="Games" min={0} {...form.getInputProps("games")} />
        <NumberInput hideControls label="At Bats" min={0} {...form.getInputProps("atBat")} />
        <NumberInput hideControls label="Runs" min={0} {...form.getInputProps("runs")} />
        <NumberInput hideControls label="Hits" min={0} {...form.getInputProps("hits")} />
        <NumberInput hideControls label="Doubles" min={0} {...form.getInputProps("doubles")} />
        <NumberInput hideControls label="Triples" min={0} {...form.getInputProps("triples")} />
        <NumberInput hideControls label="Home Runs" min={0} {...form.getInputProps("homeRuns")} />
        <NumberInput hideControls label="RBI" min={0} {...form.getInputProps("rbi")} />
        <NumberInput hideControls label="Walks" min={0} {...form.getInputProps("walks")} />
        <NumberInput hideControls label="Strikeouts" min={0} {...form.getInputProps("strikeouts")} />
        <NumberInput hideControls label="Stolen Bases" min={0} {...form.getInputProps("stolenBases")} />
        <NumberInput hideControls label="Caught Stealing" min={0} {...form.getInputProps("caughtStealing")} />
        <NumberInput hideControls label="Batting Avg" min={0} step={0.001} decimalScale={3} {...form.getInputProps("battingAvg")} />
        <NumberInput hideControls label="OBP" min={0} step={0.001} decimalScale={3} {...form.getInputProps("obp")} />
        <NumberInput hideControls label="SLG" min={0} step={0.001} decimalScale={3} {...form.getInputProps("slg")} />
        <NumberInput hideControls label="OPS" min={0} step={0.001} decimalScale={3} {...form.getInputProps("ops")} />
      </SimpleGrid>

      <Group justify="space-between">
        <Anchor href={`/players/${player.id}`} size="sm">
          Cancel
        </Anchor>
        <Button type="submit" loading={submitting}>
          Save Changes
        </Button>
      </Group>
    </form>
  );
}
