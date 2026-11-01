import reducer, { hydrateGameState, setBowlingTactics } from './gameSlice';
import { fieldSettingList } from '../../gameData/fieldSettingList';

test('all field presets survive save hydration', () => {
  expect(fieldSettingList).toHaveLength(12);
  fieldSettingList.forEach(({ key }) => {
    const updated = reducer(undefined, setBowlingTactics({ fieldPreset: key }));
    const restored = reducer(undefined, hydrateGameState({ bowlingTactics: updated.bowlingTactics }));
    expect(restored.bowlingTactics.fieldPreset).toBe(key);
  });
});

test('persists and restores a custom field layout, then replaces it with a preset', () => {
  const fieldPositions = [
    'wicketkeeper', 'gully', 'point', 'cover', 'midOff',
    'midOn', 'midWicket', 'squareLeg', 'fineLeg', 'longOn',
  ];
  const updated = reducer(undefined, setBowlingTactics({ fieldPreset: 'custom', fieldPositions }));
  expect(updated.bowlingTactics).toMatchObject({ fieldPreset: 'custom', fieldPositions });
  const restored = reducer(undefined, hydrateGameState({ bowlingTactics: updated.bowlingTactics }));
  expect(restored.bowlingTactics).toEqual(updated.bowlingTactics);
  const preset = reducer(restored, setBowlingTactics({ fieldPreset: 'boundary' }));
  expect(preset.bowlingTactics.fieldPreset).toBe('boundary');
  expect(preset.bowlingTactics).not.toHaveProperty('fieldPositions');
});
