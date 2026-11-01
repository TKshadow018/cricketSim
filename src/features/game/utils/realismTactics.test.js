import { createRealismDelivery, getGeometricFieldShift, selectComputerBattingPlan } from './realismTactics';
import { buildOutcomeWeights, resolveOutcome } from './controllerOutcomeUtils';
import { battingAction } from '../../../gameData/actionType';

test('geometric field coverage follows the actual coordinates and batter handedness', () => {
  const offSide = ['wicketkeeper', 'deepCover'];
  const legSide = ['wicketkeeper', 'deepMidWicket'];
  const shot = { shot: 'loft', target: 'cover' };
  expect(getGeometricFieldShift({ positions: offSide, shot })['4'])
    .toBeLessThan(getGeometricFieldShift({ positions: legSide, shot })['4']);
  expect(getGeometricFieldShift({ positions: legSide, shot, handedness: 'left' })['4']).toBeLessThan(0);
});

test('an infield point fielder restricts singles without acting as a deep boundary fielder', () => {
  const shift = getGeometricFieldShift({
    positions: ['wicketkeeper', 'point'],
    shot: { shot: 'rotate', target: 'point' },
  });
  expect(shift['1']).toBeLessThan(0);
  const gap = getGeometricFieldShift({ positions: ['wicketkeeper'], shot: { shot: 'rotate', target: 'point' } });
  expect(shift['4']).toBe(gap['4']);
});

test('the computer batter attacks a demanding chase without needing the pending delivery', () => {
  const attack = selectComputerBattingPlan({
    inningState: { balls: 108, score: 100, wickets: 3 },
    matchType: { over: 20 },
    target: 140,
  });
  const defend = selectComputerBattingPlan({
    inningState: { balls: 30, score: 25, wickets: 8 },
    matchType: { over: 20 },
    target: null,
  });
  expect(attack.approach).toBe('attack');
  expect(defend.approach).toBe('defend');
});

test('Test batting and new-ball bowling plans do not apply limited-overs aggression automatically', () => {
  const state = { balls: 0, score: 0, wickets: 8 };
  const matchType = { over: 90, unlimitedBowling: true };
  expect(selectComputerBattingPlan({ inningState: state, matchType, target: null }))
    .toMatchObject({ approach: 'balanced', shot: 'rotate' });
  const delivery = createRealismDelivery({
    inningState: state,
    matchType,
    matchTypeKey: 'test',
    isFirstInnings: true,
    isUserBatting: false,
    isUserBowling: false,
    striker: { abilityToPlayPaceBall: 70 },
    bowler: { paceAbility: 70 },
    random: () => 0,
  });
  expect(delivery.bowling.overPlan).toBe('balanced');
});

test('identical realistic plans yield the same probabilities regardless of user control', () => {
  const input = {
    striker: { abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 65 },
    bowler: { paceAbility: 70, spinAbility: 30 },
    inningState: { balls: 50, freeHitArmed: false },
    battingRoles: {},
    bowlingRoles: {},
    matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
    matchType: { over: 20 },
    matchTypeKey: 't20',
    ruleset: 'realism',
    realismDelivery: {
      batting: { approach: 'balanced', shot: 'loft', target: 'cover' },
      bowling: { overPlan: 'balanced', fieldPreset: 'boundary', line: 'stumps', length: 'good', variation: 'stock' },
      fieldPositions: ['wicketkeeper', 'deepCover'],
    },
  };
  const ai = buildOutcomeWeights({ ...input, isUserBatting: false, isUserBowling: false });
  const batting = buildOutcomeWeights({ ...input, isUserBatting: true, isUserBowling: false });
  const bowling = buildOutcomeWeights({ ...input, isUserBatting: false, isUserBowling: true });
  expect(batting).toEqual(ai);
  expect(bowling).toEqual(ai);
  expect(Object.values(ai).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 8);
});

test('realistic ability effects change continuously rather than only at fixed bands', () => {
  const input = {
    striker: { abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 65 },
    bowler: { paceAbility: 70, spinAbility: 30 },
    inningState: { balls: 0 },
    battingRoles: {},
    bowlingRoles: {},
    matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
    matchType: { over: 20 },
    matchTypeKey: 't20',
    ruleset: 'realism',
  };
  const equal = buildOutcomeWeights(input);
  const slightlyBetter = buildOutcomeWeights({
    ...input,
    striker: { ...input.striker, abilityToPlayPaceBall: 71 },
  });
  expect(slightlyBetter.W).toBeLessThan(equal.W);
  expect(slightlyBetter['4']).toBeGreaterThan(equal['4']);
});

test('outfield speed changes ground boundaries, not balls cleared in the air', () => {
  const input = {
    striker: { abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 },
    bowler: { paceAbility: 70, spinAbility: 30 },
    inningState: { balls: 0 },
    battingRoles: {},
    bowlingRoles: {},
    matchType: { over: 20 },
    matchTypeKey: 't20',
    ruleset: 'realism',
  };
  const lush = buildOutcomeWeights({ ...input, matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' } });
  const fast = buildOutcomeWeights({ ...input, matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'fastAndHard' } });
  expect(fast['4']).toBeGreaterThan(lush['4']);
  expect(fast['6']).toBeCloseTo(lush['6'], 8);
});

test('a caught shot credits the fielder positioned near its actual sector', () => {
  const bowler = { name: 'Bowler', paceAbility: 70, spinAbility: 20 };
  const input = {
    striker: { abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 },
    bowler,
    bowlingSide: [bowler, { name: 'Keeper', isWicketKeeper: true }, { name: 'Cover Fielder' }],
    inningState: { balls: 0, strikerIndex: 0, nonStrikerIndex: 1 },
    battingRoles: {},
    bowlingRoles: {},
    matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
    matchType: { over: 20 },
    matchTypeKey: 't20',
    ruleset: 'realism',
    realismDelivery: {
      batting: { approach: 'balanced', shot: 'loft', target: 'cover' },
      bowling: { overPlan: 'balanced', fieldPreset: 'balanced', line: 'stumps', length: 'good', variation: 'stock' },
      fieldPositions: ['wicketkeeper', 'deepCover'],
    },
  };
  const weights = buildOutcomeWeights(input);
  const roll = 1 - weights.W / 100 + 0.1 * weights.W / 100;
  expect(resolveOutcome({ ...input, random: () => roll }).dismissal).toMatchObject({
    type: 'caught',
    fielderName: 'Cover Fielder',
    fielderPosition: 'deepCover',
  });
});

test('realism excludes arcade skills, captain bonuses and super-shot boosts', () => {
  const batting = { approach: 'balanced', shot: 'rotate', target: 'straight' };
  const bowling = { overPlan: 'balanced', fieldPreset: 'balanced', line: 'stumps', length: 'good', variation: 'stock' };
  const striker = { id: 'batter', abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 };
  const input = {
    striker,
    bowler: { id: 'bowler', paceAbility: 70, spinAbility: 20 },
    inningState: { balls: 0 },
    battingRoles: {},
    bowlingRoles: {},
    matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
    matchType: { over: 20 },
    matchTypeKey: 't20',
    ruleset: 'realism',
    isUserBatting: true,
    realismDelivery: { batting, bowling, fieldPositions: ['wicketkeeper', 'point'] },
  };
  const normal = buildOutcomeWeights(input);
  const arcadeBoosts = buildOutcomeWeights({
    ...input,
    striker: { ...striker, skills: ['HardHitter'] },
    battingRoles: { captainId: 'batter' },
    battingIntent: battingAction.superShot,
  });
  expect(arcadeBoosts).toEqual(normal);
});
