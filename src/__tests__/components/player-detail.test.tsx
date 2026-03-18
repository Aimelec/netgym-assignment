import { screen, within } from "@testing-library/react";
import { render } from "./render";
import { PlayerDetail } from "@/components/player-detail";
import type { Player } from "@/types/player";

const player: Player = {
  id: "abc-123",
  playerName: "Mike Trout",
  position: "CF",
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
  description: null,
  descriptionStatus: "pending",
  locallyModified: false,
};

describe("PlayerDetail", () => {
  it("renders player name and position badge", () => {
    render(<PlayerDetail player={player} />);

    expect(screen.getByText("Mike Trout")).toBeInTheDocument();
    const badge = screen.getByText("Mike Trout").closest("div")!;
    expect(within(badge).getByText("CF")).toBeInTheDocument();
  });

  it("renders all stat cards", () => {
    render(<PlayerDetail player={player} />);

    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("134")).toBeInTheDocument();
    expect(screen.getByText("Home Runs")).toBeInTheDocument();
    expect(screen.getByText("39")).toBeInTheDocument();
    expect(screen.getByText("RBI")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });

  it("formats float stats to 3 decimal places", () => {
    render(<PlayerDetail player={player} />);

    expect(screen.getByText("0.312")).toBeInTheDocument();
    expect(screen.getByText("0.460")).toBeInTheDocument();
    expect(screen.getByText("0.628")).toBeInTheDocument();
    expect(screen.getByText("1.088")).toBeInTheDocument();
  });

  it("renders back link to players list", () => {
    render(<PlayerDetail player={player} />);

    const link = screen.getByText("Back to players").closest("a");
    expect(link).toHaveAttribute("href", "/players");
  });

  it("displays dash for null stats", () => {
    const nullPlayer: Player = {
      ...player,
      games: null,
      hits: null,
      battingAvg: null,
    };

    render(<PlayerDetail player={nullPlayer} />);

    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});
