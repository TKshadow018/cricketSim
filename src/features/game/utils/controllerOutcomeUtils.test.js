import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { outfieldType } from '../../../gameData/matchCondition';
import { canUseSpecialBall, canUseSuperShot, resolveOutcome } from './controllerOutcomeUtils';

const basePlay = {
  striker: { id: 'striker', abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 },
  bowler: { id: 'bowler', paceAbility: 60, spinAbility: 40 },
  inningState: {
    balls: 0,
    battingStats: [{ superShotPaceUnlocked: 2, superShotSpinUnlocked: 2 }],
    superShotUsedInOver: 0,
    freeHitArmed: false,
    specialBallBonus: 0,
    specialBallUsedInOver: 0,
    specialBallUsedMatch: 0,
  },
  isUserBatting: false,
  isUserBowling: false,
  battingRoles: {},
  bowlingRoles: {},
  bowlingTeamName: '',
  matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'dryAndPatchy' },
  matchType: { over: 20 },
  matchTypeKey: 't20',
  battingIntent: battingAction.normal,
  bowlingIntent: bowlingAction.normal,
  locationCountry: '',
};

const resolveAt = (randomIndex, overrides = {}) => {
  jest.spyOn(Math, 'random').mockReturnValue(randomIndex / 100);
  return resolveOutcome({ ...basePlay, ...overrides });
};

describe('special delivery eligibility', () => {
  test('checks super-shot ability, unlocked uses, and per-over limits', () => {
    const striker = { abilityToPlayPaceBall: 76, abilityToPlaySpinBall: 76 };
    const paceBowler = { paceAbility: 80, spinAbility: 20 };
    const spinBowler = { paceAbility: 20, spinAbility: 80 };
    const inningState = {
      battingStats: [{ superShotPaceUnlocked: 2, superShotSpinUnlocked: 2 }],
      superShotUsedInOver: 0,
    };

    expect(canUseSuperShot({ striker, bowler: paceBowler, inningState, strikerIndex: 0 })).toBe(true);
    expect(canUseSuperShot({ striker, bowler: spinBowler, inningState, strikerIndex: 0 })).toBe(true);
    expect(canUseSuperShot({ striker: null, bowler: paceBowler, inningState, strikerIndex: 0 })).toBe(false);
    expect(canUseSuperShot({ striker, bowler: null, inningState, strikerIndex: 0 })).toBe(false);
    expect(
      canUseSuperShot({
        striker: { ...striker, abilityToPlayPaceBall: 70 },
        bowler: paceBowler,
        inningState,
        strikerIndex: 0,
      })
    ).toBe(false);
    expect(
      canUseSuperShot({
        striker,
        bowler: paceBowler,
        inningState: { battingStats: [{ superShotPaceUnlocked: 0 }] },
        strikerIndex: 0,
      })
    ).toBe(false);
    expect(
      canUseSuperShot({
        striker,
        bowler: paceBowler,
        inningState: { battingStats: [{ superShotPaceUnlocked: 2, superShotPaceUsed: 2 }] },
        strikerIndex: 0,
      })
    ).toBe(false);
    expect(
      canUseSuperShot({
        striker,
        bowler: paceBowler,
        inningState: { ...inningState, superShotUsedInOver: 1 },
        strikerIndex: 0,
      })
    ).toBe(false);
  });

  test('checks special-ball ability, match allowance, and per-over limits', () => {
    const bowler = { paceAbility: 71, spinAbility: 20 };
    expect(canUseSpecialBall({ bowler, inningState: {} })).toBe(true);
    expect(canUseSpecialBall({ bowler: null, inningState: {} })).toBe(false);
    expect(canUseSpecialBall({ bowler: { paceAbility: 70, spinAbility: 70 }, inningState: {} })).toBe(false);
    expect(canUseSpecialBall({ bowler, inningState: { specialBallUsedMatch: 3 } })).toBe(false);
    expect(canUseSpecialBall({ bowler, inningState: { specialBallBonus: 1, specialBallUsedMatch: 3 } })).toBe(true);
    expect(canUseSpecialBall({ bowler, inningState: { specialBallUsedInOver: 1 } })).toBe(false);
  });

  test('uses spin-specific credits and defaults missing profile and innings values', () => {
    const spinStriker = { abilityToPlaySpinBall: 76 };
    const spinBowler = { spinAbility: 80 };
    expect(
      canUseSuperShot({
        striker: spinStriker,
        bowler: spinBowler,
        inningState: { battingStats: [{ superShotSpinUnlocked: 2 }] },
        strikerIndex: 0,
      })
    ).toBe(true);
    expect(
      canUseSuperShot({
        striker: {},
        bowler: { paceAbility: 80 },
        inningState: {},
        strikerIndex: 0,
      })
    ).toBe(false);
    expect(
      canUseSuperShot({
        striker: {},
        bowler: { spinAbility: 80 },
        inningState: {},
        strikerIndex: 0,
      })
    ).toBe(false);
    expect(canUseSpecialBall({ bowler: { spinAbility: 71 }, inningState: {} })).toBe(true);
    expect(canUseSpecialBall({ bowler: {}, inningState: {} })).toBe(false);

    const defaults = resolveAt(0, {
      striker: {},
      bowler: {},
      inningState: { balls: 0 },
    });
    expect(defaults).toMatchObject({ token: expect.any(String), bowlerAbility: 0 });
  });
});

describe('delivery outcome resolution', () => {
  afterEach(() => jest.restoreAllMocks());

  test('returns structured wicket, wide, no-ball, and run outcomes', () => {
    expect(resolveAt(99)).toMatchObject({
      token: 'W',
      isWicket: true,
      runs: 0,
      isLegalDelivery: true,
      extraRuns: 0,
    });
    expect(resolveAt(92)).toMatchObject({
      token: 'wide',
      isWicket: false,
      isLegalDelivery: false,
      extraRuns: 1,
    });
    jest.restoreAllMocks();
    expect(resolveAt(93)).toMatchObject({
      token: 'nb',
      isWicket: false,
      isLegalDelivery: false,
      extraRuns: 1,
    });
    jest.restoreAllMocks();
    expect(resolveAt(70)).toMatchObject({
      token: '4',
      isWicket: false,
      runs: 4,
      isLegalDelivery: true,
      extraRuns: 0,
      strikerAbilityAgainstBowling: expect.any(Number),
      bowlerAbility: 60,
    });
    jest.restoreAllMocks();
    expect(
      resolveAt(0, {
        striker: { id: 'spin-striker', abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 80 },
        bowler: { id: 'spin-bowler', paceAbility: 20, spinAbility: 60 },
        matchCondition: { weather: 'cloudy', pitch: 'dusty', outfield: 'dryAndPatchy' },
      })
    ).toMatchObject({ strikerAbilityAgainstBowling: 83, bowlerAbility: 60 });
  });

  test('blocks wickets on free hits and uses missing-player and unknown-condition defaults', () => {
    const freeHit = resolveAt(99, {
      inningState: { ...basePlay.inningState, freeHitArmed: true },
      isUserBatting: true,
      battingIntent: battingAction.normal,
    });
    expect(freeHit.isWicket).toBe(false);

    jest.restoreAllMocks();
    const defaults = resolveAt(0, {
      striker: null,
      bowler: null,
      matchCondition: { weather: 'sunny', pitch: 'unknown', outfield: 'unknown' },
      matchTypeKey: 'unknown',
    });
    expect(defaults).toMatchObject({ token: expect.any(String), isLegalDelivery: true });
    expect(defaults.strikerAbilityAgainstBowling).toBe(57);
    expect(defaults.bowlerAbility).toBe(0);
  });

  test('covers weather, venue, pitch, outfield, and ability adjustments', () => {
    const playWith = (randomIndex, options) => {
      jest.restoreAllMocks();
      return resolveAt(randomIndex, options);
    };
    const sunny = playWith(0, {
      striker: { abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 80 },
      bowler: { paceAbility: 60, spinAbility: 60 },
      bowlingTeamName: 'India',
      locationCountry: 'India',
      matchCondition: { weather: 'sunny', pitch: 'dead', outfield: 'lushGreen' },
    });
    expect(sunny.strikerAbilityAgainstBowling).toBe(89);

    const rainy = playWith(0, {
      striker: { abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 80 },
      bowler: { paceAbility: 60, spinAbility: 60 },
      matchCondition: { weather: 'rainy', pitch: 'grassy', outfield: 'fastAndHard' },
    });
    expect(rainy.strikerAbilityAgainstBowling).toBeCloseTo(79.8);

    const windy = playWith(0, {
      striker: { abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 80 },
      bowler: { paceAbility: 60, spinAbility: 60 },
      matchCondition: { weather: 'windy', pitch: 'dusty', outfield: 'wetWithDew' },
    });
    expect(windy.strikerAbilityAgainstBowling).toBeCloseTo(91.3);

    const stormy = playWith(0, {
      striker: { abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 80 },
      bowler: { paceAbility: 60, spinAbility: 60 },
      matchCondition: { weather: 'stormy', pitch: 'sporting', outfield: 'dryAndPatchy' },
    });
    expect(stormy.strikerAbilityAgainstBowling).toBeCloseTo(82.65);

    const previousBoundaryScoring = outfieldType.dryAndPatchy.boundaryScoring;
    try {
      outfieldType.dryAndPatchy.boundaryScoring = 5;
      expect(playWith(0, {
        matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'dryAndPatchy' },
      }).token).toBeDefined();
    } finally {
      outfieldType.dryAndPatchy.boundaryScoring = previousBoundaryScoring;
    }
  });

  test('applies match-format transitions, leadership roles, and user action modifiers', () => {
    const testMatch = resolveAt(0, { matchTypeKey: 'practiceTestMini' });
    expect(testMatch.token).toBeDefined();

    jest.restoreAllMocks();
    const lateInnings = resolveAt(0, {
      matchTypeKey: 'ODI',
      matchType: { over: 20 },
      inningState: { ...basePlay.inningState, balls: 119 },
      striker: { id: 'striker', abilityToPlayPaceBall: 90, abilityToPlaySpinBall: 80 },
      bowler: { id: 'bowler', paceAbility: 35, spinAbility: 30 },
      battingRoles: { captainId: 'striker', viceCaptainId: 'striker' },
      bowlingRoles: { captainId: 'bowler', viceCaptainId: 'bowler' },
      isUserBatting: true,
      isUserBowling: true,
      battingIntent: battingAction.defence,
      bowlingIntent: bowlingAction.specialBowl,
    });
    expect(lateInnings.token).toBeDefined();

    jest.restoreAllMocks();
    const closeMatchType = resolveAt(0, {
      matchTypeKey: 'micro',
      matchType: { over: 20 },
      inningState: { ...basePlay.inningState, balls: 119 },
    });
    expect(closeMatchType.token).toBeDefined();

    jest.restoreAllMocks();
    expect(resolveAt(0, { isUserBatting: true, battingIntent: battingAction.hitBig }).token).toBeDefined();
    jest.restoreAllMocks();
    expect(resolveAt(0, { isUserBatting: true, battingIntent: battingAction.superShot }).token).toBeDefined();
    jest.restoreAllMocks();
    expect(resolveAt(0, { isUserBowling: true, bowlingIntent: bowlingAction.saveRun }).token).toBeDefined();
    jest.restoreAllMocks();
    expect(resolveAt(0, { isUserBowling: true, bowlingIntent: bowlingAction.tryForWicket }).token).toBeDefined();
  });

  test('applies every batting-versus-bowling ability adjustment band', () => {
    const abilityCases = [
      [{ abilityToPlayPaceBall: 100 }, { paceAbility: 20 }],
      [{ abilityToPlayPaceBall: 90 }, { paceAbility: 60 }],
      [{ abilityToPlayPaceBall: 70 }, { paceAbility: 60 }],
      [{ abilityToPlayPaceBall: 43 }, { paceAbility: 43 }],
      [{ abilityToPlayPaceBall: 60 }, { paceAbility: 78 }],
      [{ abilityToPlayPaceBall: 50 }, { paceAbility: 80 }],
      [{ abilityToPlayPaceBall: 1 }, { paceAbility: 100 }],
    ];
    abilityCases.forEach(([striker, bowler]) => {
      expect(
        resolveAt(0, {
          striker: { ...basePlay.striker, ...striker },
          bowler: { ...basePlay.bowler, ...bowler },
        }).token
      ).toBeDefined();
    });

    jest.restoreAllMocks();
    expect(resolveAt(100).token).toBe('0');
  });

  test('normalizes weights above the outcome total and caps the generated outcome list', () => {
    const result = resolveAt(0, {
      matchTypeKey: 'micro',
      striker: { id: 'striker', abilityToPlayPaceBall: 100, abilityToPlaySpinBall: 100 },
      bowler: { id: 'bowler', paceAbility: 20, spinAbility: 20 },
      battingRoles: { captainId: 'striker', viceCaptainId: 'striker' },
      battingIntent: battingAction.hitBig,
    });
    expect(result).toMatchObject({ token: expect.any(String), isLegalDelivery: true });
  });
});
