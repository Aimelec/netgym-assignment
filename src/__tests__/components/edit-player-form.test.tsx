import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notifications } from "@mantine/notifications";
import { render } from "./render";
import { EditPlayerForm } from "@/components/edit-player-form";
import { makeDbPlayer } from "../factories/player-factory";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock;

const player = makeDbPlayer({
  id: "abc-123",
  playerName: "Mike Trout",
  games: 134,
  atBat: 470,
  runs: 101,
  hits: 147,
  doubles: 27,
  triples: 3,
  homeRuns: 39,
  rbi: 90,
  walks: 94,
  strikeouts: 124,
  stolenBases: 11,
  caughtStealing: 2,
  battingAvg: 0.312,
  obp: 0.46,
  slg: 0.628,
  ops: 1.088,
});

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
  fetchMock.mockClear();
  notifications.clean();
});

describe("EditPlayerForm", () => {
  it("renders form with player values", () => {
    render(<EditPlayerForm player={player} />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Mike Trout");
    expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue("CF");
  });

  it("renders all stat fields", () => {
    render(<EditPlayerForm player={player} />);

    expect(screen.getByRole("textbox", { name: "Games" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Hits" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Home Runs" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Batting Avg" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "OPS" })).toBeInTheDocument();
  });

  it("renders save and cancel buttons", () => {
    render(<EditPlayerForm player={player} />);

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    const cancelLink = screen.getByText("Cancel").closest("a");
    expect(cancelLink).toHaveAttribute("href", "/players/abc-123");
  });

  it("submits updated values via PATCH and redirects", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();

    render(<EditPlayerForm player={player} />);

    const nameInput = screen.getByRole("textbox", { name: "Name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Mike T.");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/players/abc-123", expect.objectContaining({
        method: "PATCH",
      }));
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.playerName).toBe("Mike T.");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/players/abc-123");
    });

    const notificationContainer = document.querySelector(".mantine-Notification-root")!;
    expect(within(notificationContainer as HTMLElement).getByText("Player updated")).toBeInTheDocument();
    expect(within(notificationContainer as HTMLElement).getByText("Mike Trout was updated successfully")).toBeInTheDocument();
  });

  it("displays error message on failed submission", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Player not found" }),
    });
    const user = userEvent.setup();

    render(<EditPlayerForm player={player} />);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      const notificationContainer = document.querySelector(".mantine-Notification-root")!;
      expect(within(notificationContainer as HTMLElement).getByText("Update failed")).toBeInTheDocument();
      expect(within(notificationContainer as HTMLElement).getByText("Player not found")).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});

