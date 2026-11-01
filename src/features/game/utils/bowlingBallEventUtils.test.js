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
