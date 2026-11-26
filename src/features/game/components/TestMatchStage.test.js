import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider, useSelector } from 'react-redux';
import gameReducer from '../gameSlice';
import { finishTestInnings, startTestMatch } from '../utils/testMatch';
import { resolveOutcome } from '../utils/controllerOutcomeUtils';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import TestMatchStage from './TestMatchStage';

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
  default: ({ waitingForNextBowler, bowlerCandidates, onSelectBowler, canPlayNextBall, onBowlBall }) => (
    <div>
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
  return <TestMatchStage game={game} ownPlayers={ownPlayers} opponentPlayers={opponentPlayers} onMatchPrimaryAction={jest.fn()} onSaveGame={onSaveGame} />;
};

test('a live Test uses the match-wide time limit and records a draw', () => {
  resolveOutcome.mockReturnValue({ token: '0', runs: 0, extraRuns: 0, isWicket: false, isLegalDelivery: true });
  const initialGame = gameReducer(undefined, { type: '@@init' });
  const store = configureStore({
    reducer: { game: gameReducer },
    preloadedState: {
      game: {
        ...initialGame,
        stage: matchStatusEnum.TeamOneBat,
        ownTeam: 'A',
        opponentTeam: 'B',
        firstBattingSide: 'opponent',
        matchTypeKey: 'test',
        matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
        testMatch: startTestMatch({ ...context, firstSide: 'opponent', randomSeed: 123, days: 1, oversPerDay: 1 }),
      },
    },
  });
  render(<Provider store={store}><Harness /></Provider>);
  fireEvent.click(screen.getByRole('button', { name: 'Bowler 0' }));
  for (let index = 0; index < 6; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Next ball' }));
  expect(store.getState().game.testMatch.result).toMatchObject({ type: 'draw' });
  expect(store.getState().game.stage).toBe(matchStatusEnum.MatchEnd);
  expect(screen.getByText('The match is drawn.')).toBeInTheDocument();
});

test('the user may declare and choose whether to enforce a follow-on', () => {
  const initialGame = gameReducer(undefined, { type: '@@init' });
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 456 });
  const makeStore = (testMatch) => configureStore({
    reducer: { game: gameReducer },
    preloadedState: {
      game: {
        ...initialGame,
        stage: matchStatusEnum.TeamOneBat,
        ownTeam: 'A',
        opponentTeam: 'B',
        firstBattingSide: 'own',
        matchTypeKey: 'test',
        matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
        testMatch,
      },
    },
  });
  const store = makeStore(state);
  const { unmount } = render(<Provider store={store}><Harness /></Provider>);
  fireEvent.click(screen.getByRole('button', { name: 'Declare innings' }));
  expect(store.getState().game.testMatch.innings[0].reason).toBe('declared');
  unmount();

  state = finishTestInnings({ ...context, state: { ...state, currentInnings: { ...state.currentInnings, score: 400 } }, reason: 'declared' });
  state = finishTestInnings({ ...context, state: { ...state, currentInnings: { ...state.currentInnings, score: 150, wickets: 10 } }, reason: 'allOut' });
  const followOnStore = makeStore(state);
  render(<Provider store={followOnStore}><Harness /></Provider>);
  fireEvent.click(screen.getByRole('button', { name: 'Enforce follow-on' }));
  expect(followOnStore.getState().game.testMatch).toMatchObject({ phase: 'batting', currentSide: 'opponent' });
});

test('a completed Test exposes its real innings scorecards and can be saved', () => {
  const initialGame = gameReducer(undefined, { type: '@@init' });
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 11, days: 1, oversPerDay: 1 });
  state.currentInnings = {
    ...state.currentInnings,
    score: 5,
    balls: 6,
    battingStats: state.currentInnings.battingStats.map((stat, index) => index === 0 ? { ...stat, runs: 5, balls: 6 } : stat),
  };
  state = finishTestInnings({ ...context, state, reason: 'time' });
  const store = configureStore({
    reducer: { game: gameReducer },
    preloadedState: {
      game: {
        ...initialGame,
        stage: matchStatusEnum.MatchEnd,
        ownTeam: 'A',
        opponentTeam: 'B',
        matchTypeKey: 'test',
        testMatch: state,
      },
    },
  });
  const save = jest.fn();
  render(<Provider store={store}><Harness onSaveGame={save} /></Provider>);
  fireEvent.click(screen.getByRole('button', { name: 'Show Scorecard' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('A Innings 5/0');
  expect(screen.getByRole('dialog')).toHaveTextContent('A 0');
  fireEvent.click(screen.getByRole('button', { name: 'Close Scoreboard' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Match' }));
  expect(save).toHaveBeenCalled();
});
