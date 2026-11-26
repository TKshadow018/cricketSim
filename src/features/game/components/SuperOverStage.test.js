import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider, useSelector } from 'react-redux';
import gameReducer from '../gameSlice';
import { startSuperOver } from '../utils/superOver';
import { resolveOutcome } from '../utils/controllerOutcomeUtils';
import SuperOverStage from './SuperOverStage';

jest.mock('../utils/controllerOutcomeUtils', () => ({
  canUseSpecialBall: jest.fn(() => false),
  canUseSuperShot: jest.fn(() => false),
  resolveOutcome: jest.fn(),
}));
jest.mock('../../../utils/speechUtils', () => ({
  announceTarget: jest.fn(),
  ballByBallCommentry: jest.fn(() => 'Dot ball.'),
  speak: jest.fn(),
}));
jest.mock('./StageShell', () => ({ __esModule: true, default: ({ title, children }) => <section><h2>{title}</h2>{children}</section> }));
jest.mock('./InningsStage', () => ({
  __esModule: true,
  default: ({ needsOpeners, openerCandidates, onSelectOpener, waitingForNextBowler, bowlerCandidates, onSelectBowler, canPlayNextBall, onBowlBall }) => (
    <div>
      {needsOpeners && openerCandidates.map(({ index }) => (
        <button key={index} onClick={() => onSelectOpener(index)}>Opener {index}</button>
      ))}
      {waitingForNextBowler && bowlerCandidates.map(({ index }) => (
        <button key={index} onClick={() => onSelectBowler(index)}>Bowler {index}</button>
      ))}
      <button disabled={!canPlayNextBall} onClick={onBowlBall}>Next ball</button>
    </div>
  ),
}));

const players = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 70,
  paceAbility: 60,
  spinAbility: 20,
}));
const ownPlayers = players('A');
const opponentPlayers = players('B');
const context = { ownPlayers, opponentPlayers, ownTeam: 'A', opponentTeam: 'B', userTeamName: 'A' };

const Harness = ({ onSaveGame }) => {
  const game = useSelector((state) => state.game);
  return <SuperOverStage game={game} ownPlayers={ownPlayers} opponentPlayers={opponentPlayers} onMatchPrimaryAction={jest.fn()} onSaveGame={onSaveGame} />;
};

test('the user plays both innings and can start another Super Over after a tie', () => {
  resolveOutcome.mockReturnValue({ token: '0', runs: 0, extraRuns: 0, isWicket: false, isLegalDelivery: true });
  const initialGame = gameReducer(undefined, { type: '@@init' });
  const store = configureStore({
    reducer: { game: gameReducer },
    preloadedState: {
      game: {
        ...initialGame,
        ownTeam: 'A',
        opponentTeam: 'B',
        tournamentUserTeam: 'A',
        matchTypeKey: 't20',
        matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
        tournamentTiebreak: startSuperOver({ ...context, originalFirstSide: 'own', randomSeed: 123 }),
      },
    },
  });
  const save = jest.fn();
  render(<Provider store={store}><Harness onSaveGame={save} /></Provider>);
  fireEvent.click(screen.getByRole('button', { name: 'Bowler 0' }));
  for (let index = 0; index < 6; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Next ball' }));
  expect(store.getState().game.tournamentTiebreak.phase).toBe('second');
  fireEvent.click(screen.getByRole('button', { name: 'Opener 0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Opener 1' }));
  for (let index = 0; index < 6; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Next ball' }));
  expect(store.getState().game.tournamentTiebreak.phase).toBe('complete');
  fireEvent.click(screen.getByRole('button', { name: 'Show Scorecard' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('A Super Over 1');
  expect(screen.getByRole('dialog')).toHaveTextContent('B Super Over 1');
  fireEvent.click(screen.getByRole('button', { name: 'Close Scoreboard' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Match' }));
  expect(save).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Next Super Over' }));
  expect(store.getState().game.tournamentTiebreak).toMatchObject({ round: 2, phase: 'first', firstSide: 'own' });
});

test('a Super Over without the user team simulates and resolves automatically', async () => {
  jest.useFakeTimers();
  const dot = { token: '0', runs: 0, extraRuns: 0, isWicket: false, isLegalDelivery: true };
  resolveOutcome.mockReset();
  for (let index = 0; index < 6; index += 1) resolveOutcome.mockReturnValueOnce(dot);
  resolveOutcome.mockReturnValue({ token: '1', runs: 1, extraRuns: 0, isWicket: false, isLegalDelivery: true });
  const initialGame = gameReducer(undefined, { type: '@@init' });
  const store = configureStore({
    reducer: { game: gameReducer },
    preloadedState: {
      game: {
        ...initialGame,
        ownTeam: 'A',
        opponentTeam: 'B',
        tournamentUserTeam: 'Other',
        matchTypeKey: 't20',
        matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
        tournamentTiebreak: startSuperOver({ ...context, userTeamName: 'Other', originalFirstSide: 'own', randomSeed: 456 }),
      },
    },
  });
  const { unmount } = render(<Provider store={store}><Harness /></Provider>);
  for (let index = 0; index < 10; index += 1) {
    await act(async () => { jest.runOnlyPendingTimers(); await Promise.resolve(); });
  }
  expect(store.getState().game.tournamentTiebreak).toMatchObject({ phase: 'resolved', winnerTeam: 'A' });
  unmount();
  jest.useRealTimers();
});
