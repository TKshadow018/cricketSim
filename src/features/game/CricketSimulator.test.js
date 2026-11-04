import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { makeController, mockController, prepareSimulatorTest, setMockController } from "./CricketSimulatorTestSupport";
import CricketSimulator from "./CricketSimulator";

describe("CricketSimulator analytics", () => {
  beforeEach(prepareSimulatorTest);

  test('resets the simulator scroll position when moving to another stage', () => {
    const { container, rerender } = render(<CricketSimulator />);
    const shell = container.querySelector('.sim-shell');

    shell.scrollTop = 180;
    setMockController(makeController({ game: { stage: 20 } }));
    rerender(<CricketSimulator />);

    expect(shell.scrollTop).toBe(0);
  });

test('opens domestic stats, player profiles, league tables, and league player rankings', () => {
    const { rerender } = render(<CricketSimulator />);

    fireEvent.click(screen.getByRole('button', { name: 'Domestic Teams Season Stats' }));
    const domesticDialog = screen.getByRole('dialog', { name: 'Domestic team season statistics' });
    expect(within(domesticDialog).getByText('Domestic Teams - Current Season Player Statistics')).toBeInTheDocument();
    expect(within(domesticDialog).getByRole('tab', { name: 'Falcons' })).toBeInTheDocument();
    expect(within(domesticDialog).getByText('Batting')).toBeInTheDocument();
    expect(within(domesticDialog).getByText('Bowling')).toBeInTheDocument();
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Alice' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'Sharks' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Unknown player' })[0]);
    expect(screen.queryByRole('dialog', { name: 'Career player profile' })).not.toBeInTheDocument();
    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'Falcons' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Alice' })[1]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));

    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'ODI' }));
    expect(within(domesticDialog).getByRole('tab', { name: 'ODI' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'My Current Stats/Ability' }));
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('My Current Season Stats and Ability');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));

    fireEvent.click(screen.getByRole('button', { name: 'See League Table' }));
    const leagueDialog = screen.getByRole('dialog', { name: 'League table by format' });
    expect(within(leagueDialog).getByText('T20 Standings (India)')).toBeInTheDocument();
    expect(within(leagueDialog).getByText('Falcons')).toBeInTheDocument();
    fireEvent.change(within(leagueDialog).getByLabelText('Country'), { target: { value: 'England' } });
    expect(within(leagueDialog).getByText('Ravens')).toBeInTheDocument();
    fireEvent.click(within(leagueDialog).getByRole('tab', { name: 'ODI' }));
    expect(within(leagueDialog).getByText('ODI Standings (England)')).toBeInTheDocument();
    fireEvent.click(within(leagueDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'See League Player Statistics' }));
    const playerStatsDialog = screen.getByRole('dialog', { name: 'League player statistics by format' });
    expect(within(playerStatsDialog).getByText(/Top 20 Scorers/)).toBeInTheDocument();
    fireEvent.change(within(playerStatsDialog).getByLabelText('Country'), { target: { value: 'India' } });
    expect(within(playerStatsDialog).getAllByRole('button', { name: 'Alice' })).toHaveLength(2);
    fireEvent.click(within(playerStatsDialog).getAllByRole('button', { name: 'Alice' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(playerStatsDialog).getByRole('tab', { name: 'ODI' }));
    fireEvent.click(within(playerStatsDialog).getAllByRole('button', { name: 'Alice' })[1]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(playerStatsDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    setMockController(makeController({
      careerDomesticTeams: null,
      careerDomesticCountry: '',
      careerPlayerProfile: {},
      careerPlayerStats: null,
      careerStandings: null,
      careerGlobalPlayerPool: null,
    }));
    rerender(<CricketSimulator />);
    expect(screen.getByRole('button', { name: 'My Current Stats/Ability' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Domestic Teams Season Stats' }));
    const emptyDomesticDialog = screen.getByRole('dialog', { name: 'Domestic team season statistics' });
    expect(within(emptyDomesticDialog).getByText('No team data available for this format yet.')).toBeInTheDocument();
    fireEvent.click(emptyDomesticDialog.querySelector('button[aria-label="Close"]'));
    fireEvent.click(screen.getByRole('button', { name: 'See League Table' }));
    const emptyLeagueDialog = screen.getByRole('dialog', { name: 'League table by format' });
    expect(within(emptyLeagueDialog).getByText('ODI Standings (N/A)')).toBeInTheDocument();
    expect(within(emptyLeagueDialog).getByLabelText('Country')).toHaveValue('');
    fireEvent.click(emptyLeagueDialog.querySelector('button[aria-label="Close"]'));
    fireEvent.click(screen.getByRole('button', { name: 'See League Player Statistics' }));
    fireEvent.click(screen.getByRole('dialog', { name: 'League player statistics by format' }).querySelector('button[aria-label="Close"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const emptySearch = screen.getByRole('dialog', { name: 'Global player search' });
    fireEvent.change(within(emptySearch).getByPlaceholderText('Player Name'), { target: { value: 'Unavailable' } });
    expect(within(emptySearch).getByText('Players List (0)')).toBeInTheDocument();
    fireEvent.click(emptySearch.querySelector('button[aria-label="Close"]'));
  });

test('resolves career player statistics by name when player IDs are unavailable or do not match', () => {
    setMockController(makeController({
      careerTeam: '',
      careerPlayerProfile: { name: 'Alice', age: 25, team: 'Falcons' },
      careerPlayerStats: {
        legacy: {
          team: 'Falcons',
          name: 'Alice',
          runs: 10,
          balls: 0,
          outs: 0,
          wickets: 0,
          ballsBowled: 0,
          runsConceded: 0,
          matches: 0,
          formatStats: { t20: { runs: 10, balls: 0, outs: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 } },
        },
        keyFallback: {
          key: 'Falcons::99::Ghost',
          runs: 30,
          balls: 10,
          outs: 0,
          wickets: 1,
          matches: 2,
          formatStats: { t20: { runs: 30, balls: 10, outs: 0, wickets: 1, ballsBowled: 6, runsConceded: 5, matches: 2 } },
        },
        twin: {
          key: 'Falcons::100::Twin',
          team: 'Falcons',
          name: 'Twin',
          playerId: 100,
          formatStats: { t20: { runs: 10, balls: 0, outs: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 } },
        },
        zero: {
          key: 'External::405::Zero',
          team: 'External',
          name: 'Zero',
          playerId: 405,
          formatStats: { t20: { runs: 0, balls: 0, outs: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 } },
        },
        external: {
          key: 'External::404::Orphan',
          team: 'External',
          name: 'Orphan',
          playerId: 404,
          formatStats: { t20: { runs: 5, balls: 5, outs: 1, wickets: 1, ballsBowled: 6, runsConceded: 3, matches: 1 } },
        },
        invalid: {},
        nullEntry: null,
      },
      careerDomesticTeams: [
        {
          name: 'Falcons',
          country: 'India',
          players: [
            { id: 'replacement-id', name: 'Alice', playerType: 'batsman' },
            { id: '99', name: 'Ghost', playerType: 'bowler' },
            { id: '100', name: 'Twin', playerType: 'batsman' },
          ],
        },
        { name: 'External', country: 'India', players: [] },
        { country: 'India', players: [] },
        { name: 'No Roster', country: 'India', players: null },
      ],
    }));
    const { rerender } = render(<CricketSimulator />);

    fireEvent.click(screen.getByRole('button', { name: 'My Current Stats/Ability' }));
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));

    fireEvent.click(screen.getByRole('button', { name: 'Domestic Teams Season Stats' }));
    const domesticDialog = screen.getByRole('dialog', { name: 'Domestic team season statistics' });
    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'Falcons' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Alice' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Ghost' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Ghost');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'See League Player Statistics' }));
    const leaguePlayers = screen.getByRole('dialog', { name: 'League player statistics by format' });
    fireEvent.click(within(leaguePlayers).getByRole('tab', { name: 'T20' }));
    fireEvent.click(within(leaguePlayers).getAllByRole('button', { name: 'Orphan' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Orphan');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(leaguePlayers).getAllByRole('button', { name: 'Close' }).at(-1));

    setMockController(makeController({
      careerTeam: '',
      careerPlayerProfile: { name: 'No Stats' },
      careerPlayerStats: {},
      careerDomesticTeams: null,
    }));
    rerender(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'My Current Stats/Ability' }));
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('No Stats');
  });
});
