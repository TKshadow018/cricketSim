import { bowlingAction } from '../../../gameData/actionType';
import {
  DEFAULT_BOWLING_TACTICS,
  getBowlingTacticShift,
  getAvailableBowlingVariations,
  getLegacyBowlingIntent,
  migrateLegacyBowlingTactics,
  normalizeBowlingTactics,
} from './bowlingTactics';

describe('bowling tactics', () => {
  test('normalizes saved and partial tactics without losing valid selections', () => {
    expect(normalizeBowlingTactics({
      overPlan: 'attack',
      fieldPreset: 'boundary',
      line: 'outside',
      length: 'yorker',
      variation: 'slower',
      specialDeliveryArmed: true,
    })).toEqual({
      overPlan: 'attack',
      fieldPreset: 'boundary',
      line: 'outside',
      length: 'yorker',
      variation: 'slower',
      specialDeliveryArmed: true,
    });

    expect(normalizeBowlingTactics({ overPlan: 'unknown', line: null }, {
      ...DEFAULT_BOWLING_TACTICS,
      overPlan: 'pressure',
      line: 'body',
    })).toMatchObject({
      overPlan: 'pressure',
      line: 'body',
      length: 'good',
      specialDeliveryArmed: false,
    });
  });

  test('maps legacy intents to safe plan defaults without arming a special delivery', () => {
    expect(migrateLegacyBowlingTactics(bowlingAction.normal).overPlan).toBe('balanced');
    expect(migrateLegacyBowlingTactics(bowlingAction.tryForWicket).overPlan).toBe('attack');
    expect(migrateLegacyBowlingTactics(bowlingAction.saveRun).overPlan).toBe('contain');
    expect(migrateLegacyBowlingTactics(bowlingAction.specialBowl)).toMatchObject({
      overPlan: 'balanced',
      specialDeliveryArmed: false,
    });
    expect(getLegacyBowlingIntent('attack')).toBe(bowlingAction.tryForWicket);
    expect(getLegacyBowlingIntent('contain')).toBe(bowlingAction.saveRun);
  });

  test('combines strategy, field, target, and bowler-compatible variation modifiers', () => {
    const paceBowler = { paceAbility: 82, spinAbility: 24 };
    const spinBowler = { paceAbility: 25, spinAbility: 83 };
    const balanced = getBowlingTacticShift(DEFAULT_BOWLING_TACTICS, paceBowler);
    const attack = getBowlingTacticShift({ ...DEFAULT_BOWLING_TACTICS, overPlan: 'attack' }, paceBowler);
    const boundaryField = getBowlingTacticShift({ ...DEFAULT_BOWLING_TACTICS, fieldPreset: 'boundary' }, paceBowler);
    const slowerBall = getBowlingTacticShift({ ...DEFAULT_BOWLING_TACTICS, variation: 'slower' }, paceBowler);

    expect(balanced).toEqual({});
    expect(attack.W).toBeGreaterThan(balanced.W || 0);
    expect(boundaryField['4']).toBeLessThan(0);
    expect(boundaryField['6']).toBeLessThan(0);
    expect(slowerBall).not.toEqual({});
    expect(getAvailableBowlingVariations(paceBowler).map(({ key }) => key)).toEqual(
      expect.arrayContaining(['stock', 'slower', 'cutter'])
    );
    expect(getAvailableBowlingVariations(spinBowler).map(({ key }) => key)).toEqual(
      expect.arrayContaining(['stock', 'flighted', 'quicker'])
    );
    expect(getAvailableBowlingVariations({ paceAbility: 40, spinAbility: 40 }).map(({ key }) => key))
      .toEqual(['stock']);
  });
});
