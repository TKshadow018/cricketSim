import { buildInitialInnings } from '../../gameSlice';
import { battingAction } from '../../../../gameData/actionType';
import { buildInningsViewModel } from './controllerInningsViewModel';

const battingSide = [
  {
    id: 'bat-1',
    name: 'Striker',
    playerType: 'batsman',
    abilityToPlayPaceBall: 90,
    abilityToPlaySpinBall: 85,
    battingOrderCoeff: 90,
  },
  { id: 'bat-2', name: 'Partner', playerType: 'batsman', abilityToPlayPaceBall: 65, abilityToPlaySpinBall: 60 },
  { id: 'bat-3', name: 'Dismissed', playerType: 'batsman', abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 55 },
];
const bowlingSide = [
  { id: 'bowl-1', name: 'Current Bowler', playerType: 'bowler pacer', paceAbility: 85, spinAbility: 20 },
  { id: 'bowl-2', name: 'Previous Bowler', playerType: 'bowler spinner', paceAbility: 20, spinAbility: 80 },
  { id: 'keeper', name: 'Keeper', isWicketKeeper: true, paceAbility: 100 },
];
const getContext = () => ({
  isUserBatting: true,
  isUserBowling: false,
  battingSide,
  bowlingSide,
});

describe('innings view model', () => {
  test('builds ordered score rows, eligible selection options, and action availability', () => {
    const inningState = {
      ...buildInitialInnings(),
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
      lastOverBowlerIndex: 1,
      battingOrderIndices: [2, 0, 99, -1],
      outBatterIndices: [2],
      battingStats: [
        { runs: 10, balls: 5, isOut: false },
        { runs: 5, balls: 4, isOut: false },
        { runs: 20, balls: 10, isOut: true, outByBowler: 'Current Bowler', outAtScore: '40/2', outAtBall: '5.2' },
      ],
      bowlingStats: [
        { balls: 6, runsConceded: 12, wickets: 2 },
        { balls: 12, runsConceded: 24, wickets: 1 },
        { balls: 0, runsConceded: 0, wickets: 0 },
      ],
    };
    const model = buildInningsViewModel({
      isFirstInnings: true,
      inningState,
      getContext,
      matchType: { over: 20 },
      maxBalls: 120,
    });

    expect(model).toMatchObject({
      isUserBatting: true,
      isUserBowling: false,
      strikerName: 'Striker',
      nonStrikerName: 'Partner',
      currentBowlerName: 'Current Bowler',
      canPlayNextBall: true,
    });
    expect(model.battingRows.map(({ name }) => name)).toEqual(['Dismissed', 'Striker', 'Partner']);
    expect(model.battingRows[0]).toMatchObject({
      dismissal: 'b Current Bowler @ 40/2 (5.2)',
      isNotOut: false,
    });
    expect(model.battingRows[1]).toMatchObject({ dismissal: 'Not Out', isNotOut: true, strikeRate: '200.00' });
    expect(model.bowlingRows).toHaveLength(2);
    expect(model.bowlingRows[0]).toMatchObject({ overs: '1.0', economy: '12.00', avgPerWicket: '6.00', isCurrent: true });
    expect(model.nextBatterCandidates[0]).toMatchObject({ disabled: true, reason: 'Currently batting' });
    expect(model.nextBatterCandidates[2]).toMatchObject({ disabled: true, reason: 'Already out' });
    expect(model.bowlerCandidates.map(({ index }) => index)).toEqual([0]);

    const freeHitModel = buildInningsViewModel({
      isFirstInnings: true,
      inningState: { ...inningState, freeHitArmed: true },
      getContext,
      matchType: { over: 20 },
      maxBalls: 120,
    });
    expect(freeHitModel.battingActionOptions.filter(({ key }) => key !== battingAction.freeHit).every(({ disabled }) => disabled)).toBe(true);
    expect(freeHitModel.battingActionOptions.find(({ key }) => key === battingAction.freeHit)).toMatchObject({ disabled: false, reason: '' });
  });

  test('handles empty teams and unset selections without offering actions or a next ball', () => {
    const model = buildInningsViewModel({
      isFirstInnings: false,
      inningState: buildInitialInnings(),
      getContext: () => ({
        isUserBatting: false,
        isUserBowling: false,
        battingSide: [],
        bowlingSide: [],
      }),
      matchType: { over: 5 },
      maxBalls: 30,
    });

    expect(model).toMatchObject({
      strikerName: '',
      nonStrikerName: '',
      currentBowlerName: '',
      strikerPlayer: null,
      nonStrikerPlayer: null,
      currentBowlerPlayer: null,
      canPlayNextBall: false,
      openerCandidates: [],
      nextBatterCandidates: [],
      bowlerCandidates: [],
      battingRows: [],
      bowlingRows: [],
    });
  });

  test('covers sparse scorecards, available actions, and ineligible bowling choices', () => {
    const sparseBattingSide = [
      {
        name: 'Active Batter',
        abilityToPlayPaceBall: 76,
        battingOrderCoeff: 80,
      },
      { name: 'Dismissed Batter' },
      { name: 'Waiting Batter' },
    ];
    const sparseBowlingSide = [
      { name: 'Last Over Bowler', playerType: 'bowler pacer', paceAbility: 80, spinAbility: 20 },
      { name: 'Quota Bowler', playerType: 'bowler', paceAbility: 0, spinAbility: 0 },
      { name: 'Keeper', isWicketKeeper: true },
    ];
    const inningState = {
      ...buildInitialInnings(),
      strikerIndex: 0,
      nonStrikerIndex: 99,
      currentBowlerIndex: 0,
      lastOverBowlerIndex: 0,
      battingOrderIndices: null,
      outBatterIndices: [1],
      battingStats: [
        { runs: 0, balls: 0, superShotPaceUnlocked: 2 },
        { isOut: true },
        undefined,
      ],
      bowlingStats: [
        { balls: 6, runsConceded: 12, wickets: 1 },
        { balls: 120, runsConceded: 200, wickets: 0 },
        undefined,
      ],
    };
    const model = buildInningsViewModel({
      isFirstInnings: true,
      inningState,
      getContext: () => ({
        isUserBatting: true,
        isUserBowling: true,
        battingSide: sparseBattingSide,
        bowlingSide: sparseBowlingSide,
      }),
      matchType: { over: 20 },
      maxBalls: 120,
    });

    expect(model.battingActionOptions.find(({ key }) => key === battingAction.superShot)).toMatchObject({
      disabled: false,
      reason: '',
    });
    expect(model.battingRows.map(({ dismissal }) => dismissal)).toEqual([
      'Not Out',
      'b Unknown @ - (-)',
      'Yet to bat',
    ]);
    expect(model.bowlingRows).toHaveLength(2);
    expect(model.bowlingRows[1]).toMatchObject({ avgPerWicket: '-', economy: '10.00' });
    expect(model.bowlerCandidates).toEqual([]);
    expect(model.nonStrikerName).toBe('');
    expect(model.currentBowlerName).toBe('Last Over Bowler');

    const invalidSelections = buildInningsViewModel({
      isFirstInnings: true,
      inningState: {
        ...buildInitialInnings(),
        strikerIndex: 99,
        nonStrikerIndex: 99,
        currentBowlerIndex: 99,
      },
      getContext: () => ({
        isUserBatting: false,
        isUserBowling: false,
        battingSide: sparseBattingSide,
        bowlingSide: sparseBowlingSide,
      }),
      matchType: { over: 20 },
      maxBalls: 120,
    });
    expect(invalidSelections).toMatchObject({
      strikerName: '',
      nonStrikerName: '',
      currentBowlerName: '',
      nonStrikerPlayer: null,
    });
  });
});
