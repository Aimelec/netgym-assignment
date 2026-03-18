"use client";

import { AppShell, Anchor, Title } from "@mantine/core";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 50 }}>
      <AppShell.Header bg="blue.6" p="sm">
        <Anchor href="/players" underline="never" c="white">
          <Title order={3}>Baseball Players</Title>
        </Anchor>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
