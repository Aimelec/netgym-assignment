import { Container } from "@mantine/core";
import { getPlayers } from "@/interactors/get-players";
import { PlayersTable } from "@/components/players-table";
import { flattenSearchParams } from "@/utils/search-params";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlayersPage({ searchParams }: Props) {
  const flatParams = flattenSearchParams(await searchParams);
  const result = await getPlayers(flatParams);

  return (
    <Container size="xl" py="xl">
      <PlayersTable
        players={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        sortBy={flatParams.sortBy ?? "playerName"}
        sortOrder={flatParams.sortOrder ?? "asc"}
      />
    </Container>
  );
}
