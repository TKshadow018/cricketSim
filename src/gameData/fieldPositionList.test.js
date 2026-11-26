import { fieldPositionImage, fieldPositionList } from './fieldPositionList';
import { fieldSettingList } from './fieldSettingList';

describe('cricket field reference data', () => {
  test('includes named, in-bounds coordinates for realistic fielding positions', () => {
    expect(fieldPositionList.length).toBeGreaterThanOrEqual(40);
    expect(new Set(fieldPositionList.map(({ key }) => key)).size).toBe(fieldPositionList.length);

    fieldPositionList.forEach((position) => {
      expect(position).toMatchObject({
        key: expect.any(String),
        name: expect.any(String),
        x: expect.any(Number),
        y: expect.any(Number),
      });
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThan(fieldPositionImage.width);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThan(fieldPositionImage.height);
    });
  });

  test('uses known field positions for each complete field setting', () => {
    const positionKeys = new Set(fieldPositionList.map(({ key }) => key));

    expect(fieldSettingList.map(({ key }) => key)).toEqual([
      'balanced',
      'attacking',
      'boundary',
      'newBall',
      'spinAttack',
      'powerplay',
      'ring',
      'middleOvers',
      'deathOvers',
      'offSide',
      'legSide',
      'defendSingle',
    ]);

    expect(new Set(fieldSettingList.map(({ positions }) => [...positions].sort().join(','))).size)
      .toBe(12);
    fieldSettingList.forEach((setting) => {
      expect(setting.positions).toHaveLength(10);
      expect(new Set(setting.positions).size).toBe(10);
      expect(setting.positions[0]).toBe('wicketkeeper');
      expect(setting.positions).not.toContain('bowler');
      expect(setting.description).toEqual(expect.any(String));
      setting.positions.forEach((positionKey) => {
        expect(positionKeys.has(positionKey)).toBe(true);
      });
    });
  });
});
