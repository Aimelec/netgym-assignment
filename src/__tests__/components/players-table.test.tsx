import { screen, within } from "@testing-library/react";
import { render } from "./render";
import { PlayersTable } from "@/components/players-table";
import { makeDbPlayerList } from "../factories/player-factory";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const makePlayers = (count: number) => makeDbPlayerList(count);

const defaultProps = {
  players: makePlayers(3),
  total: 3,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  sortBy: "playerName",
  sortOrder: "asc",
};

beforeEach(() => {
  pushMock.mockClear();
});

describe("PlayersTable", () => {
  it("renders all player rows", () => {
    render(<PlayersTable {...defaultProps} />);

    expect(screen.getByText("Player A")).toBeInTheDocument();
    expect(screen.getByText("Player B")).toBeInTheDocument();
    expect(screen.getByText("Player C")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<PlayersTable {...defaultProps} />);

    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent);

    expect(headerTexts).toEqual([
      "Name", "Position", "Games", "Hits", "Home Runs", "Batting Avg", "OPS",
    ]);
  });

  it("displays total player count", () => {
    render(<PlayersTable {...defaultProps} />);

    expect(screen.getByText("3 players total")).toBeInTheDocument();
  });

  it("renders player names as links to detail pages", () => {
    render(<PlayersTable {...defaultProps} />);

    const link = screen.getByText("Player A").closest("a");
    expect(link).toHaveAttribute("href", "/players/id-0");
  });

  it("formats batting average to 3 decimal places", () => {
    render(<PlayersTable {...defaultProps} />);

    const table = screen.getByRole("table");
    const cells = within(table).getAllByText("0.300");
    expect(cells.length).toBe(3);
  });

  it("displays dash for null stats", () => {
    const players = makePlayers(1);
    players[0].games = null;
    players[0].battingAvg = null;

    render(<PlayersTable {...defaultProps} players={players} total={1} />);

    const table = screen.getByRole("table");
    const dashes = within(table).getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows current sort selection", () => {
    render(<PlayersTable {...defaultProps} sortBy="hits" sortOrder="desc" />);

    expect(screen.getByRole("textbox", { name: "Sort by" })).toHaveValue("Hits");
    expect(screen.getByRole("textbox", { name: "Order" })).toHaveValue("Descending");
  });
});
