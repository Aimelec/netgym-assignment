import { render, RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Suspense, ReactElement } from "react";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <Notifications />
      <Suspense fallback={null}>{children}</Suspense>
    </MantineProvider>
  );
}

function renderWithMantine(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: Wrapper, ...options });
}

export { renderWithMantine as render };
