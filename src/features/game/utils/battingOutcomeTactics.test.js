import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { resolveOutcome } from './controllerOutcomeUtils';
import { DEFAULT_BATTING_TACTICS } from './battingTactics';

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

const countOutcomes = (overrides = {}) => {
  const counts = {};
  let roll = 0;
  const randomSpy = jest.spyOn(Math, 'random').mockImplementation(() => {
    const value = roll / 100;
    roll += 1;
    return value;
  });

  try {
    for (let index = 0; index < 100; index += 1) {
      const outcome = resolveOutcome({
        ...basePlay,
        isUserBatting: true,
        ...overrides,
      });
      counts[outcome.token] = (counts[outcome.token] || 0) + 1;
    }
  } finally {
    randomSpy.mockRestore();
  }

  return counts;
};

const outcomeTotal = (counts) => Object.values(counts).reduce((sum, count) => sum + count, 0);

describe('batting tactic outcome effects', () => {
  test('each non-default approach, shot, and target changes normalized outcome chances', () => {
    const baseline = countOutcomes({ battingTactics: DEFAULT_BATTING_TACTICS });
    const distributions = {
      defend: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, approach: 'defend' },
      }),
      attack: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, approach: 'attack' },
      }),
      leave: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, shot: 'leave' },
      }),
      drive: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, shot: 'drive' },
      }),
      cutPull: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, shot: 'cutPull' },
      }),
      loft: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, shot: 'loft' },
      }),
      offSide: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, target: 'off' },
      }),
      legSide: countOutcomes({
        battingTactics: { ...DEFAULT_BATTING_TACTICS, target: 'leg' },
      }),
    };

    Object.values(distributions).forEach((distribution) => {
      expect(distribution).not.toEqual(baseline);
      expect(outcomeTotal(distribution)).toBe(100);
    });

    expect(distributions.defend['0'] - baseline['0']).toBeGreaterThanOrEqual(12);
    expect(distributions.defend.W).toBeLessThan(baseline.W);
    expect(distributions.attack.W).toBeGreaterThan(baseline.W);
    expect(distributions.attack['4'] + distributions.attack['6'])
      .toBeGreaterThan(baseline['4'] + baseline['6']);
    expect(distributions.leave['0'] - baseline['0']).toBeGreaterThanOrEqual(6);
    expect(distributions.drive['4']).toBeGreaterThan(baseline['4']);
    expect(distributions.cutPull['6']).toBeGreaterThan(baseline['6']);
    expect(distributions.loft['6']).toBeGreaterThan(baseline['6']);
    expect(distributions.loft.W).toBeGreaterThan(baseline.W);
    expect(distributions.offSide['4']).toBeGreaterThan(baseline['4']);
    expect(distributions.legSide['6']).toBeGreaterThan(baseline['6']);
  });

  test('preserves the previous Defend and Hit Big effects', () => {
    const previousDefend = countOutcomes({ battingIntent: battingAction.defence });
    const newDefend = countOutcomes({
      battingTactics: { ...DEFAULT_BATTING_TACTICS, approach: 'defend' },
    });
    const previousHitBig = countOutcomes({ battingIntent: battingAction.hitBig });
    const newAttack = countOutcomes({
      battingTactics: { ...DEFAULT_BATTING_TACTICS, approach: 'attack' },
    });

    expect(newDefend).toEqual(previousDefend);
    expect(newAttack).toEqual(previousHitBig);
  });

  test('keeps wicket probability when aggressive calls overflow the 100-slot table', () => {
    const baseline = countOutcomes({ battingTactics: DEFAULT_BATTING_TACTICS });
    const aggressive = countOutcomes({
      battingTactics: {
        ...DEFAULT_BATTING_TACTICS,
        approach: 'attack',
        shot: 'loft',
        target: 'leg',
      },
    });

    expect(aggressive.W).toBeGreaterThan(baseline.W);
    expect(outcomeTotal(aggressive)).toBe(100);
  });

  test('still guarantees no wicket on an armed free hit', () => {
    const freeHit = countOutcomes({
      battingIntent: battingAction.freeHit,
      battingTactics: {
        ...DEFAULT_BATTING_TACTICS,
        approach: 'attack',
        shot: 'loft',
        target: 'leg',
      },
      inningState: { ...basePlay.inningState, freeHitArmed: true },
    });

    expect(freeHit.W || 0).toBe(0);
    expect(outcomeTotal(freeHit)).toBe(100);
  });
});
