import { battingAction } from '../../../gameData/actionType';
import {
  DEFAULT_BATTING_TACTICS,
  getBattingTacticShift,
  getBattingTacticsResetPatch,
  mergeBattingTactics,
  migrateLegacyBattingTactics,
  normalizeBattingTactics,
} from './battingTactics';

describe('batting tactics', () => {
  test('normalizes partial and invalid tactical state with safe defaults', () => {
    expect(normalizeBattingTactics({
      approach: 'attack',
      shot: 'loft',
      target: 'leg',
      retainShotAndTarget: true,
    })).toEqual({
      approach: 'attack',
      shot: 'loft',
      target: 'leg',
      retainShotAndTarget: true,
    });

    expect(normalizeBattingTactics({
      approach: 'unknown',
      shot: null,
      target: 'off',
      retainShotAndTarget: 'yes',
    })).toEqual({
      ...DEFAULT_BATTING_TACTICS,
      target: 'off',
    });
  });

  test('merges tactical updates and maps legacy batting intents during migration', () => {
    expect(mergeBattingTactics(DEFAULT_BATTING_TACTICS, { approach: 'defend', target: 'off' }))
      .toEqual({ ...DEFAULT_BATTING_TACTICS, approach: 'defend', target: 'off' });
    expect(migrateLegacyBattingTactics(battingAction.defence).approach).toBe('defend');
    expect(migrateLegacyBattingTactics(battingAction.hitBig).approach).toBe('attack');
    expect(migrateLegacyBattingTactics(battingAction.normal).approach).toBe('balanced');
    expect(migrateLegacyBattingTactics(battingAction.superShot).approach).toBe('balanced');
  });

  test('combines approach, shot, target, and bowling-line effects without changing balanced defaults', () => {
    const neutral = getBattingTacticShift(DEFAULT_BATTING_TACTICS, {
      line: 'stumps',
      length: 'good',
    });
    const defensive = getBattingTacticShift({
      ...DEFAULT_BATTING_TACTICS,
      approach: 'defend',
      shot: 'leave',
    });
    const attacking = getBattingTacticShift({
      ...DEFAULT_BATTING_TACTICS,
      approach: 'attack',
      shot: 'loft',
      target: 'leg',
    });
    const alignedTarget = getBattingTacticShift({
      ...DEFAULT_BATTING_TACTICS,
      target: 'off',
    }, { line: 'outside' });

    expect(neutral).toEqual({});
    expect(defensive['0']).toBeGreaterThan(0);
    expect(defensive.W).toBeLessThan(0);
    expect(attacking['6']).toBeGreaterThan(0);
    expect(attacking.W).toBeGreaterThan(0);
    expect(alignedTarget).not.toEqual({});
    expect(Object.values(attacking).reduce((total, shift) => total + shift, 0)).toBe(0);
  });

  test('resets one-ball choices unless retained, and always resets them around free hits or new batters', () => {
    const selected = {
      ...DEFAULT_BATTING_TACTICS,
      approach: 'attack',
      shot: 'loft',
      target: 'leg',
    };
    const retained = { ...selected, retainShotAndTarget: true };

    expect(getBattingTacticsResetPatch(selected)).toEqual({
      shot: DEFAULT_BATTING_TACTICS.shot,
      target: DEFAULT_BATTING_TACTICS.target,
    });
    expect(getBattingTacticsResetPatch(retained)).toBeNull();
    expect(getBattingTacticsResetPatch(retained, { wasFreeHit: true })).toEqual({
      shot: DEFAULT_BATTING_TACTICS.shot,
      target: DEFAULT_BATTING_TACTICS.target,
    });
    expect(getBattingTacticsResetPatch(retained, { freeHitArmed: true })).toEqual({
      shot: DEFAULT_BATTING_TACTICS.shot,
      target: DEFAULT_BATTING_TACTICS.target,
    });
    expect(getBattingTacticsResetPatch(retained, { newBatterAtStrike: true })).toEqual({
      shot: DEFAULT_BATTING_TACTICS.shot,
      target: DEFAULT_BATTING_TACTICS.target,
    });
    expect(getBattingTacticsResetPatch(retained, { resetAll: true })).toEqual(DEFAULT_BATTING_TACTICS);
    expect(getBattingTacticsResetPatch(DEFAULT_BATTING_TACTICS)).toBeNull();
  });
});
