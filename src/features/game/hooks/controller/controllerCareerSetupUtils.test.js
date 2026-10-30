import { skillList } from '../../../../gameData/skillList';
import { buildCreatedCareerPlayer } from './controllerCareerSetupUtils';

describe('career player skills', () => {
  test('assigns no more than two catalog skills to a created career player', () => {
    const player = buildCreatedCareerPlayer(
      { name: 'Career Player', playerType: 'batsman' },
      'India'
    );

    expect(Array.isArray(player.skills)).toBe(true);
    expect(player.skills.length).toBeLessThanOrEqual(2);
    expect(player.skills.every((skill) => skillList.includes(skill))).toBe(true);
  });
});
