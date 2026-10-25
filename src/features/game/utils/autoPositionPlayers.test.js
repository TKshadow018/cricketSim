import BangladeshPlayers from '../../../gameData/players/Bangladesh';
import { autoPositionPlayers } from './autoPositionPlayers';

const selectedBangladeshXI = [
  'Liton Das',
  'Tanzid Hasan',
  'Soumya Sarkar',
  'Najmul Hossain Shanto',
  'Towhid Hridoy',
  'Mushfiqur Rahim',
  'Shakib Al Hasan',
  'Mahmudullah',
  'Mehidy Hasan Miraz',
  'Taskin Ahmed',
  'Mustafizur Rahman',
].map((name) => BangladeshPlayers.find((player) => player.name === name));

describe('autoPositionPlayers', () => {
  test('orders the XI from highest to lowest batting-order preference', () => {
    const players = Array.from({ length: 11 }, (_, index) => ({
      id: index + 1,
      battingOrderPreference: (index + 1) * 90,
    }));

    const positionedPlayers = autoPositionPlayers(players, () => 0);

    expect(positionedPlayers.map((player) => player.battingOrderPreference)).toEqual([
      990,
      900,
      810,
      720,
      630,
      540,
      450,
      360,
      270,
      180,
      90,
    ]);
  });

  test('uses the random chooser to break ties in batting-order preference', () => {
    const players = [
      { name: 'First opener', battingOrderPreference: 1000 },
      { name: 'Second opener', battingOrderPreference: 1000 },
      ...Array.from({ length: 9 }, (_, index) => ({
        name: `Player ${index + 3}`,
        battingOrderPreference: 900 - index * 100,
      })),
    ];

    expect(autoPositionPlayers(players, () => 0)[0].name).toBe('First opener');
    expect(autoPositionPlayers(players, () => 0.99)[0].name).toBe('Second opener');
  });

  test('rejects preferences outside the integer 1–1000 range', () => {
    const players = Array.from({ length: 11 }, (_, index) => ({
      battingOrderPreference: index === 0 ? 1001 : 500,
    }));

    expect(() => autoPositionPlayers(players)).toThrow(
      'Invalid battingOrderPreference for selected player.'
    );
  });

  test('auto-positions a national XI according to numeric preference values', () => {
    const positionedPlayers = autoPositionPlayers(selectedBangladeshXI, () => 0);
    const preferenceValues = positionedPlayers.map((player) => player.battingOrderPreference);

    expect(positionedPlayers).toHaveLength(11);
    expect(preferenceValues).toEqual([...preferenceValues].sort((left, right) => right - left));
  });
});
