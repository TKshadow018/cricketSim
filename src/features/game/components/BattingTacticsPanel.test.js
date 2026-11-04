import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BattingTacticsPanel from './BattingTacticsPanel';
import { battingAction } from '../../../gameData/actionType';
import { DEFAULT_BATTING_TACTICS } from '../utils/battingTactics';

const makeProps = (overrides = {}) => ({
  tactics: DEFAULT_BATTING_TACTICS,
  intent: battingAction.normal,
  actions: [
    { key: battingAction.superShot, label: 'Super Shot', disabled: true, reason: 'One per over' },
    { key: battingAction.freeHit, label: 'Free Hit', disabled: true, reason: 'Available only after a no-ball' },
  ],
  context: {
    score: 42,
    wickets: 1,
    over: '5.2',
    target: 141,
    runsRemaining: 99,
    ballsRemaining: 88,
    currentRunRate: '8.08',
    requiredRunRate: '6.75',
    currentOverNumber: 6,
    currentOverBall: 3,
    striker: {
      player: { name: 'A Woodhouse', abilityToPlayPaceBall: 72 },
      runs: 29,
      balls: 60,
    },
    nonStriker: {
      player: { name: 'N Smith', abilityToPlayPaceBall: 64 },
      runs: 10,
      balls: 11,
    },
    bowler: {
      name: 'J Tongue',
      playerType: 'bowler pacer',
      paceAbility: 82,
      spinAbility: 24,
    },
    bowlerFigures: { overs: '2.0', runs: 16, wickets: 1, economy: '8.00' },
    freeHitArmed: false,
    superShotUsedInOver: 0,
    currentOverEvents: [
      {
        overNumber: 6,
        ballNumber: 1,
        token: '4',
        resultLabel: '4',
        runs: 4,
        isLegalDelivery: true,
        battingTactics: { approach: 'attack', shot: 'drive', target: 'off' },
      },
      { overNumber: 6, ballNumber: 2, token: '1', resultLabel: '1', runs: 1, isLegalDelivery: true },
    ],
    matchCondition: { pitch: 'sporting', weather: 'cloudy', outfield: 'lushGreen' },
  },
  onTacticsChange: jest.fn(),
  onIntentChange: jest.fn(),
  ...overrides,
});

describe('BattingTacticsPanel', () => {
  test('shows match pressure, player matchup, target sector, and the over tracker', () => {
    render(<BattingTacticsPanel {...makeProps()} />);

    expect(screen.getByRole('region', { name: 'Batting tactics' })).toBeInTheDocument();
    expect(screen.getByText('42/1')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('141')).toBeInTheDocument();
    expect(screen.getByText('A Woodhouse')).toBeInTheDocument();
    expect(screen.getByText('J Tongue')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Choose a scoring sector on the batting target map' }))
      .toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Select .* scoring lane/ })).toHaveLength(9);
    expect(screen.queryByRole('group', { name: 'Target sector' })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Current over ball tracker' })).toBeInTheDocument();
    expect(screen.getByText(/Last call: Attack · Drive · Cover/)).toBeInTheDocument();
  });

  test('updates approach, shot, target, and shot-retention choices', () => {
    const props = makeProps();
    render(<BattingTacticsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Attack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Midwicket scoring lane' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keep shot & target for next ball' }));

    expect(props.onTacticsChange).toHaveBeenNthCalledWith(1, { approach: 'attack' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(2, { shot: 'drive' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(3, { target: 'midWicket' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(4, { retainShotAndTarget: true });
  });

  test('preserves the special-shot limits and explains free-hit availability', () => {
    const props = makeProps();
    const { unmount } = render(<BattingTacticsPanel {...props} />);

    expect(screen.getByRole('button', { name: 'Super Shot. One per over' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Free Hit. Available only after a no-ball' })).toBeDisabled();
    unmount();

    const armed = makeProps({
      intent: battingAction.freeHit,
      actions: [
        { key: battingAction.superShot, label: 'Super Shot', disabled: true, reason: 'Free hit required this ball' },
        { key: battingAction.freeHit, label: 'Free Hit', disabled: false, reason: '' },
      ],
      context: { ...makeProps().context, freeHitArmed: true },
    });
    render(<BattingTacticsPanel {...armed} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Free hit armed/);
    expect(screen.getByRole('button', { name: 'Free Hit' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Super Shot. Free hit required this ball' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Attack' }));
    expect(armed.onTacticsChange).toHaveBeenCalledWith({ approach: 'attack' });
  });

  test('allows an eligible super shot to be armed', () => {
    const props = makeProps({
      actions: [
        { key: battingAction.superShot, label: 'Super Shot', disabled: false, reason: '' },
        { key: battingAction.freeHit, label: 'Free Hit', disabled: true, reason: 'Available only after a no-ball' },
      ],
    });
    render(<BattingTacticsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Super Shot' }));

    expect(props.onIntentChange).toHaveBeenCalledWith(battingAction.superShot);
  });
});
