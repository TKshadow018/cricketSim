import { bowlingAction } from '../../../gameData/actionType';
import {
  DEFAULT_BOWLING_TACTICS,
  getBowlingTacticShift,
  getAvailableBowlingVariations,
  getLegacyBowlingIntent,
  migrateLegacyBowlingTactics,
  mergeBowlingTactics,
  normalizeBowlingTactics,
} from './bowlingTactics';
import { fieldSettingList } from '../../../gameData/fieldSettingList';

describe('bowling tactics', () => {
  test.each([
    ['newBall', { 4: 1, 6: 1, W: 2 }],
    ['spinAttack', { 4: 1, 6: 1, W: 2 }],
    ['powerplay', { 1: -1, 4: -1, W: 1 }],
    ['ring', { 1: -2, 4: 1, W: 1 }],
    ['middleOvers', { 1: -1, 4: -1, W: 1 }],
    ['deathOvers', { 1: 1, 4: -2, 6: -2, W: -1 }],
    ['offSide', { 1: -1, 4: -1, W: 1 }],
    ['legSide', { 1: -1, 4: -1, W: 1 }],
    ['defendSingle', { 1: -2, 4: 1, W: 1 }],
  ])('supports the %s preset and applies its field effect', (fieldPreset, expectedShift) => {
    const setting = fieldSettingList.find(({ key }) => key === fieldPreset);
    expect(setting).toBeDefined();
    expect(normalizeBowlingTactics({ fieldPreset }).fieldPreset).toBe(fieldPreset);
    expect(getBowlingTacticShift({ fieldPreset })).toEqual(expectedShift);
    expect(getBowlingTacticShift({ fieldPreset: 'custom', fieldPositions: setting.positions }))
      .toEqual(expectedShift);
  });

  test('preserves valid custom positions, rejects invalid layouts and clears them on preset selection', () => {
    const positions = [...fieldSettingList[0].positions];
    positions[1] = 'gully';
    const custom = mergeBowlingTactics(DEFAULT_BOWLING_TACTICS, {
      fieldPreset: 'custom',
      fieldPositions: positions,
    });
    expect(custom).toMatchObject({ fieldPreset: 'custom', fieldPositions: positions });
    expect(normalizeBowlingTactics(custom)).toEqual(custom);
    expect(mergeBowlingTactics(custom, { fieldPositions: ['wicketkeeper', 'gully'] })).toEqual(custom);
    expect(mergeBowlingTactics(custom, { fieldPositions: positions.map(() => 'gully') })).toEqual(custom);
    expect(mergeBowlingTactics(custom, { fieldPreset: 'boundary' })).not.toHaveProperty('fieldPositions');
    expect(normalizeBowlingTactics({ fieldPreset: 'custom', fieldPositions: ['unknown'] }).fieldPreset)
      .toBe('balanced');
  });

  test('custom layouts use the closest preset for field outcome modifiers', () => {
    const attacking = fieldSettingList.find(({ key }) => key === 'attacking').positions;
    const boundary = fieldSettingList.find(({ key }) => key === 'boundary').positions;
    expect(getBowlingTacticShift({ fieldPreset: 'custom', fieldPositions: attacking }))
      .toEqual(getBowlingTacticShift({ fieldPreset: 'attacking' }));
    expect(getBowlingTacticShift({ fieldPreset: 'custom', fieldPositions: boundary }))
      .toEqual(getBowlingTacticShift({ fieldPreset: 'boundary' }));
    expect(getBowlingTacticShift({ fieldPreset: 'custom', fieldPositions: attacking }))
      .not.toEqual(getBowlingTacticShift({ fieldPreset: 'custom', fieldPositions: boundary }));
  });
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
