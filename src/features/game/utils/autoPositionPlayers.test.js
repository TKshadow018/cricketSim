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

describe('autoPositionPlayers with the Bangladesh XI', () => {
  test('assigns all 11 positions while balancing each player’s preference rank', () => {
    const positionedPlayers = autoPositionPlayers(selectedBangladeshXI, () => 0);

    expect(positionedPlayers).toHaveLength(11);
    expect(new Set(positionedPlayers.map((player) => player.id)).size).toBe(11);
    expect(positionedPlayers[0].name).toBe('Liton Das');
    expect(positionedPlayers[1].name).toBe('Tanzid Hasan');
    expect(positionedPlayers[2].name).toBe('Najmul Hossain Shanto');
    expect(positionedPlayers[3].name).toBe('Towhid Hridoy');
  });

  test('does not force a top batter into an 11th-choice tail position when a better XI assignment exists', () => {
    const positionedPlayers = autoPositionPlayers(selectedBangladeshXI, () => 0);
    const mushfiqurPosition = positionedPlayers.findIndex((player) => player.name === 'Mushfiqur Rahim') + 1;
    const preferenceRanks = positionedPlayers.map(
      (player, index) => player.battingOrderPreference.indexOf(index + 1) + 1
    );

    expect(mushfiqurPosition).toBeLessThan(11);
    expect(positionedPlayers[10].name).toBe('Mustafizur Rahman');
    expect(Math.max(...preferenceRanks)).toBe(5);
  });

  test('chooses randomly between players tied for their first-choice opening slot', () => {
    const positionedPlayers = autoPositionPlayers(selectedBangladeshXI, () => 0.99);

    expect(positionedPlayers[0].name).toBe('Tanzid Hasan');
  });
});
