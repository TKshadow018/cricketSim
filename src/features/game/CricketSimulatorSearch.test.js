import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { makeController, mockController, prepareSimulatorTest, setMockController } from "./CricketSimulatorTestSupport";
import CricketSimulator from "./CricketSimulator";

describe("CricketSimulator player search", () => {
  beforeEach(prepareSimulatorTest);

test('searches sparse unassigned players without stats or profile attributes', () => {
    setMockController(makeController({
      careerDomesticTeams: [
        { name: 'No Country', players: null },
        { country: 'India', players: [] },
      ],
      careerPlayerStats: null,
      careerGlobalPlayerPool: [
        { id: 'blank-1', name: 'Blank Player' },
        { id: 'blank-2', name: 'Blank Player' },
        { name: 'No ID', assignedTeamName: 'Falcons' },
        { id: 'nameless', name: '', assignedTeamName: 'Falcons' },
      ],
    }));
    render(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const dialog = screen.getByRole('dialog', { name: 'Global player search' });
    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: 'Blank' } });

    expect(within(dialog).getByText('Players List (2)')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Unassigned')).toHaveLength(2);
    expect(within(dialog).getAllByText('Blank Player')).toHaveLength(2);
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1));
  });

test('filters worldwide players, paginates results, and applies malformed and numeric ranges', () => {
    render(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const dialog = screen.getByRole('dialog', { name: 'Global player search' });
    expect(within(dialog).getByText('Enter at least one filter to load players.')).toBeInTheDocument();
    expect(within(dialog).getByText('Players: 0')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: 'Global' } });
    expect(within(dialog).getByText('Players List (26)')).toBeInTheDocument();
    expect(within(dialog).getByText('Page 1 of 2')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Page 2 of 2')).toBeInTheDocument();
    expect(within(dialog).getByText('Global Player 27')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Prev' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Page 2 of 2')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByPlaceholderText('Bat vs Pace (e.g. 30-80)'), { target: { value: '80-50' } });
    expect(within(dialog).getByText('Page 1 of 1')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: 'Global Player 02' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Bat vs Pace (e.g. 30-80)'), { target: { value: 'not-a-range' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Total Runs (e.g. 200-900)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Runs/Match (e.g. 20-60)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Total Wickets (e.g. 5-30)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Matches (e.g. 5-20)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Pace Ability (e.g. 40-90)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Spin Ability (e.g. 20-70)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Aggression (e.g. 50-95)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Bat vs Spin (e.g. 30-80)'), { target: { value: '0' } });
    const searchSelects = within(dialog).getAllByRole('combobox');
    fireEvent.change(searchSelects[0], { target: { value: 'Batter' } });
    fireEvent.change(searchSelects[1], { target: { value: 'India' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: '' } });
    expect(within(dialog).getByText(/^Players List \(\d+\)$/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1));
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    fireEvent.click(screen.getByRole('dialog', { name: 'Global player search' }).querySelector('button[aria-label="Close"]'));
  });

test('searches assigned players through name-based statistics and derived ability scores', () => {
    setMockController(makeController({
      careerDomesticCountry: '',
      careerPlayerStats: {
        legacy: {
          key: 'Ravens::3::Cara',
          team: 'Ravens',
          name: 'Cara',
          playerId: 3,
          runs: 20,
          balls: 10,
          outs: 0,
          wickets: 0,
          matches: 2,
          ballsBowled: 0,
          runsConceded: 0,
        },
      },
      careerGlobalPlayerPool: [{
        id: 3,
        name: 'Cara',
        assignedTeamName: 'Ravens',
        assignedTeamId: 'Ravens',
        country: 'England',
        playerType: 'Bowler',
        abilityToPlayPaceBall: 40,
        abilityToPlaySpinBall: 50,
        paceAbility: 60,
        spinAbility: 30,
        battingAggresion: 20,
        abilityScore: 0,
      }],
    }));
    render(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const dialog = screen.getByRole('dialog', { name: 'Global player search' });
    const playerName = within(dialog).getByPlaceholderText('Player Name');
    fireEvent.change(playerName, { target: { value: 'Cara' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    expect(within(dialog).getByText('10.00')).toBeInTheDocument();

    const selects = within(dialog).getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'India' } });
    expect(within(dialog).getByText('Players List (0)')).toBeInTheDocument();
    fireEvent.change(selects[1], { target: { value: 'England' } });
    fireEvent.change(selects[0], { target: { value: 'Bowler' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Matches (e.g. 5-20)'), { target: { value: '1-3' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Runs/Match (e.g. 20-60)'), { target: { value: '11-20' } });
    expect(within(dialog).getByText('Players List (0)')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Runs/Match (e.g. 20-60)'), { target: { value: '10' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1));
  });
});
