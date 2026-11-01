import { buildBowlingBallEvent } from './bowlingBallEventUtils';
import { fieldSettingList } from '../../../gameData/fieldSettingList';

test('records an independent snapshot of a custom field for the delivery', () => {
  const fieldPositions = [...fieldSettingList[1].positions];
  const event = buildBowlingBallEvent({
    inningState: { balls: 0 },
    outcome: { isLegalDelivery: true, runs: 0 },
    bowlingTactics: { fieldPreset: 'custom', fieldPositions },
    isUserBowling: true,
  });
  fieldPositions[1] = 'point';
  expect(event.tactics.fieldPreset).toBe('custom');
  expect(event.tactics.fieldPositions).toEqual(fieldSettingList[1].positions);
});

test('uses a balanced field for malformed custom delivery data', () => {
  const event = buildBowlingBallEvent({
    bowlingTactics: { fieldPreset: 'custom' },
    isUserBowling: true,
  });
  expect(event.tactics.fieldPreset).toBe('balanced');
  expect(event.tactics).not.toHaveProperty('fieldPositions');
});

test.each([
  [{ token: 'bye', runs: 0, extraRuns: 1, extras: { bye: 1 }, isLegalDelivery: true }, 'B +1'],
  [{ token: 'legBye', runs: 0, extraRuns: 2, extras: { legBye: 2 }, isLegalDelivery: true }, 'LB +2'],
  [{ token: 'nb', runs: 4, extraRuns: 1, isLegalDelivery: false }, 'NB +1 · 4 bat'],
  [{ token: 'wide', runs: 0, extraRuns: 2, isLegalDelivery: false, isWicket: true }, 'W · WD +2'],
])('records an informative label for extras and dismissals', (outcome, label) => {
  expect(buildBowlingBallEvent({ inningState: { balls: 0 }, outcome }).resultLabel).toBe(label);
});
