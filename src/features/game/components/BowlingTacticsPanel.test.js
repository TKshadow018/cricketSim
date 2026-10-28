import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BowlingTacticsPanel from './BowlingTacticsPanel';
import { DEFAULT_BOWLING_TACTICS } from '../utils/bowlingTactics';

const makeProps = (overrides = {}) => ({
  tactics: DEFAULT_BOWLING_TACTICS,
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
    bowler: {
      name: 'J Tongue',
      playerType: 'bowler pacer',
      paceAbility: 82,
      spinAbility: 24,
    },
    bowlerFigures: {
      overs: '2.0',
      runs: 16,
      wickets: 1,
      economy: '8.00',
      oversRemaining: '2.0',
    },
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
    specialDelivery: {
      available: true,
      remaining: 2,
      usedThisOver: 0,
    },
    currentOverEvents: [
      { overNumber: 6, ballNumber: 1, token: '0', runs: 0, isLegalDelivery: true },
      { overNumber: 6, ballNumber: 2, token: '1', runs: 1, isLegalDelivery: true },
    ],
    matchCondition: { pitch: 'sporting', weather: 'cloudy', outfield: 'lushGreen' },
  },
  onTacticsChange: jest.fn(),
  ...overrides,
});

describe('BowlingTacticsPanel', () => {
  test('shows match pressure, current bowler, batter matchup, field and over tracker', () => {
    render(<BowlingTacticsPanel {...makeProps()} />);

    expect(screen.getByRole('region', { name: 'Bowling tactics' })).toBeInTheDocument();
    expect(screen.getByText('42/1')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('141')).toBeInTheDocument();
    expect(screen.getByText('J Tongue')).toBeInTheDocument();
    expect(document.querySelector('.sim-bowling-figures')).toHaveTextContent('8.00 econ');
    expect(screen.getByText('A Woodhouse')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Balanced field layout/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Current over ball tracker' })).toBeInTheDocument();
    expect(screen.getByText(/Special deliveries: 2 remaining/)).toBeInTheDocument();
  });

  test('sends plan, field, pitch target, variation, and special-delivery choices', () => {
    const props = makeProps();
    render(<BowlingTacticsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /^Attack$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Boundary field' }));
    fireEvent.click(screen.getByRole('button', { name: 'Call outside channel yorker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Slower ball' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use special delivery' }));

    expect(props.onTacticsChange).toHaveBeenNthCalledWith(1, { overPlan: 'attack' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(2, { fieldPreset: 'boundary' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(3, { line: 'outside', length: 'yorker' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(4, { variation: 'slower' });
    expect(props.onTacticsChange).toHaveBeenNthCalledWith(5, { specialDeliveryArmed: true });
  });

  test('disables special deliveries and limits variations to the active bowling style', () => {
    render(
      <BowlingTacticsPanel
        {...makeProps({
          context: {
            ...makeProps().context,
            bowler: { name: 'Spinner', paceAbility: 20, spinAbility: 84 },
            specialDelivery: { available: false, remaining: 0, usedThisOver: 1 },
          },
        })}
      />
    );

    expect(screen.getByRole('button', { name: /Use special delivery/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Flighted ball' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Quicker ball' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Slower ball' })).not.toBeInTheDocument();
  });

  test('resets an incompatible saved variation when the active bowling style changes', () => {
    const props = makeProps({
      tactics: { ...DEFAULT_BOWLING_TACTICS, variation: 'slower' },
      context: {
        ...makeProps().context,
        bowler: { name: 'Spinner', paceAbility: 20, spinAbility: 84 },
      },
    });
    render(<BowlingTacticsPanel {...props} />);

    expect(props.onTacticsChange).toHaveBeenCalledWith({ variation: 'stock' });
    expect(screen.getByText(/slower is not available for this bowler/)).toBeInTheDocument();
  });
});
