import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { MODE_CAREER } from '../../utils/controllerCommonUtils';
import {
  getInningsContext,
  handleSelectBowler,
  handleSelectNextBatter,
  handleSelectOpener,
  openInnings,
  updateInningsState,
} from './controllerInningsCore';

jest.mock('../../../../utils/speechUtils', () => ({ speak: jest.fn() }));

const makePlayers = (prefix, count = 3) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} Player ${index}`,
    paceAbility: 60,
    spinAbility: 20,
    battingOrderCoeff: 80 - index,
  }));

const makeState = (overrides = {}) => ({
  needsOpeners: false,
  waitingForNextBatter: false,
  waitingForNextBowler: false,
  openerSelections: [],
  outBatterIndices: [],
  battingOrderIndices: [0, 1],
  nonStrikerIndex: 1,
  strikerIndex: 0,
  nextBatterIndex: 2,
  currentBowlerIndex: null,
  lastOverBowlerIndex: null,
  bowlingStats: [{ balls: 0 }, { balls: 0 }, { balls: 0 }],
  ...overrides,
});

const captureUpdate = (state, callback) => {
  let nextState;
  callback((isFirstInnings, updater) => {
    nextState = typeof updater === 'function' ? updater(state) : updater;
  });
  return nextState;
};

describe('innings context and state updates', () => {
  test('resolves sides and user participation for regular and created-player career matches', () => {
    const ownPlayers = [{ name: 'Created Star' }, { name: 'Other' }];
    const opponentPlayers = [{ name: 'Opponent' }, { name: 'Bowler' }];
    const shared = {
      isFirstInnings: true,
      ownPlayers,
      opponentPlayers,
      ownTeam: 'Own',
      opponentTeam: 'Opponent',
      isCurrentMatchUserInvolved: true,
      userTeamName: 'Own',
    };

    expect(getInningsContext({ ...shared, firstSide: 'own' })).toMatchObject({
      isOwnBatting: true,
      isUserBatting: true,
      isUserBowling: false,
      battingSide: ownPlayers,
      bowlingSide: opponentPlayers,
    });
    expect(getInningsContext({
      ...shared,
      firstSide: 'own',
      gameMode: MODE_CAREER,
      careerPlayerProfile: { name: ' created star ' },
      inningState: { strikerIndex: 0, currentBowlerIndex: 1 },
    })).toMatchObject({ isUserBatting: true, isUserBowling: false });
    expect(getInningsContext({
      ...shared,
      firstSide: 'opponent',
      gameMode: MODE_CAREER,
      careerPlayerProfile: { name: 'Other' },
      inningState: { strikerIndex: 0, currentBowlerIndex: 1 },
    })).toMatchObject({ isOwnBatting: false, isUserBatting: false, isUserBowling: true });
    expect(getInningsContext({
      ...shared,
      isFirstInnings: false,
      firstBattingSide: 'own',
    })).toMatchObject({ isOwnBatting: false, battingSide: opponentPlayers, bowlingSide: ownPlayers });
    expect(getInningsContext({
      ...shared,
      firstSide: 'opponent',
      gameMode: MODE_CAREER,
      careerPlayerProfile: { name: ' Created Star ' },
      inningState: { strikerIndex: null, currentBowlerIndex: undefined },
    })).toMatchObject({ isUserBatting: false, isUserBowling: '' });
    expect(getInningsContext({
      ...shared,
      isCurrentMatchUserInvolved: false,
      firstBattingSide: 'opponent',
    })).toMatchObject({ isOwnBatting: false, isUserBatting: false, isUserBowling: false });
  });

  test('updates the selected innings using a value or a state updater', () => {
    const first = jest.fn();
    const second = jest.fn();
    updateInningsState({
      isFirstInnings: true,
      firstInnings: { score: 1 },
      secondInnings: { score: 2 },
      setFirstInnings: first,
      setSecondInnings: second,
      updater: (previous) => ({ ...previous, score: previous.score + 1 }),
    });
    updateInningsState({
      isFirstInnings: false,
      firstInnings: { score: 1 },
      secondInnings: { score: 2 },
      setFirstInnings: first,
      setSecondInnings: second,
      updater: { score: 9 },
    });

    expect(first).toHaveBeenCalledWith({ score: 2 });
    expect(second).toHaveBeenCalledWith({ score: 9 });
  });

  test('opens both innings, resets the scoreboard, announces the first batting side, and advances stage', () => {
    const ownPlayers = makePlayers('own');
    const opponentPlayers = makePlayers('opponent');
    const setFirstInnings = jest.fn();
    const setSecondInnings = jest.fn();
    const dispatch = jest.fn();
    const getContext = jest.fn((isFirstInnings) => ({
      battingSide: isFirstInnings ? ownPlayers : opponentPlayers,
      bowlingSide: isFirstInnings ? opponentPlayers : ownPlayers,
      isUserBatting: isFirstInnings,
      isUserBowling: !isFirstInnings,
    }));

    openInnings({
      firstBattingSide: 'own',
      getContext,
      setFirstInnings,
      setSecondInnings,
      matchType: { over: 20 },
      dispatch,
      setShowScoreboardAction: (value) => ({ type: 'scoreboard', payload: value }),
      firstInningsTeamName: 'Own',
      setStageAction: (value) => ({ type: 'stage', payload: value }),
      matchStatusEnum,
    });

    expect(setFirstInnings).toHaveBeenCalledWith(expect.objectContaining({ needsOpeners: true }));
    expect(setSecondInnings).toHaveBeenCalledWith(expect.objectContaining({ waitingForNextBowler: true }));
    expect(getContext).toHaveBeenCalledWith(true, 'own');
    expect(getContext).toHaveBeenCalledWith(false, 'own');
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'scoreboard', payload: false });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'stage', payload: matchStatusEnum.TeamOneBat });
  });
});

describe('innings player selections', () => {
  const battingSide = makePlayers('bat', 4);
  const bowlingSide = makePlayers('bowl', 3);
  const getContext = (isFirstInnings) => ({
    battingSide,
    bowlingSide,
    isFirstInnings,
  });

  test('toggles, completes, and rotates the selected opening pair', () => {
    const initial = makeState({ needsOpeners: true });
    const oneSelected = captureUpdate(initial, (apply) =>
      handleSelectOpener({ isFirstInnings: true, selectedIndex: 0, getContext, updateState: apply })
    );
    expect(oneSelected).toMatchObject({
      needsOpeners: true,
      openerSelections: [0],
      lastEvent: 'Choose two openers to begin batting.',
    });

    const removed = captureUpdate(oneSelected, (apply) =>
      handleSelectOpener({ isFirstInnings: true, selectedIndex: 0, getContext, updateState: apply })
    );
    expect(removed.openerSelections).toEqual([]);

    const opened = captureUpdate(oneSelected, (apply) =>
      handleSelectOpener({ isFirstInnings: true, selectedIndex: 1, getContext, updateState: apply })
    );
    expect(opened).toMatchObject({
      needsOpeners: false,
      strikerIndex: 0,
      nonStrikerIndex: 1,
      nextBatterIndex: 2,
      battingOrderIndices: [0, 1],
    });

    const rotated = captureUpdate(
      makeState({ needsOpeners: true, openerSelections: [0, 1] }),
      (apply) => handleSelectOpener({ isFirstInnings: true, selectedIndex: 2, getContext, updateState: apply })
    );
    expect(rotated.openerSelections).toEqual([1, 2]);

    const notOpening = makeState();
    const unchanged = captureUpdate(notOpening, (apply) =>
      handleSelectOpener({ isFirstInnings: true, selectedIndex: 2, getContext, updateState: apply })
    );
    expect(unchanged).toEqual(notOpening);
  });

  test('accepts only an eligible next batter and preserves existing batting order', () => {
    const waiting = makeState({ waitingForNextBatter: true, outBatterIndices: [0] });
    const invalid = captureUpdate(waiting, (apply) =>
      handleSelectNextBatter({ isFirstInnings: true, batterIndex: 1, getContext, updateState: apply })
    );
    expect(invalid).toEqual(waiting);

    const selected = captureUpdate(waiting, (apply) =>
      handleSelectNextBatter({ isFirstInnings: true, batterIndex: 2, getContext, updateState: apply })
    );
    expect(selected).toMatchObject({
      waitingForNextBatter: false,
      strikerIndex: 2,
      nextBatterIndex: 3,
      battingOrderIndices: [0, 1, 2],
    });

    const alreadyOrdered = captureUpdate(
      makeState({ waitingForNextBatter: true, outBatterIndices: [0], battingOrderIndices: [0, 1, 2] }),
      (apply) => handleSelectNextBatter({ isFirstInnings: true, batterIndex: 2, getContext, updateState: apply })
    );
    expect(alreadyOrdered.battingOrderIndices).toEqual([0, 1, 2]);

    const notWaiting = captureUpdate(makeState(), (apply) =>
      handleSelectNextBatter({ isFirstInnings: true, batterIndex: 3, getContext, updateState: apply })
    );
    expect(notWaiting.waitingForNextBatter).toBe(false);
  });

  test('selects only a valid bowler while the innings waits for a new over', () => {
    const waiting = makeState({ waitingForNextBowler: true });
    const invalidState = makeState({ waitingForNextBowler: true, lastOverBowlerIndex: 0 });
    const invalid = captureUpdate(invalidState, (apply) =>
      handleSelectBowler({
        isFirstInnings: true,
        bowlerIndex: 0,
        getContext,
        matchType: { over: 20 },
        updateState: apply,
      })
    );
    expect(invalid).toEqual(invalidState);

    const selected = captureUpdate(
      makeState({ waitingForNextBowler: true, lastOverBowlerIndex: 1 }),
      (apply) =>
        handleSelectBowler({
          isFirstInnings: true,
          bowlerIndex: 0,
          getContext,
          matchType: { over: 20 },
          updateState: apply,
        })
    );
    expect(selected).toMatchObject({
      waitingForNextBowler: false,
      currentBowlerIndex: 0,
      lastEvent: 'bowl Player 0 to bowl next.',
    });

    const notWaiting = captureUpdate(makeState(), (apply) =>
      handleSelectBowler({
        isFirstInnings: true,
        bowlerIndex: 0,
        getContext,
        matchType: { over: 20 },
        updateState: apply,
      })
    );
    expect(notWaiting.waitingForNextBowler).toBe(false);
  });
});
