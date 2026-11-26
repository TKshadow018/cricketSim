import { fieldSettingList } from '../../../gameData/fieldSettingList';
import { getFieldViolations, isOutsideFieldCircle, selectLegalOpponentField } from './fieldingRules';
import { fieldPositionList } from '../../../gameData/fieldPositionList';

const positions = (key) => fieldSettingList.find((setting) => setting.key === key).positions;
const point = fieldPositionList.find((position) => position.key === 'point');
const deepPoint = fieldPositionList.find((position) => position.key === 'deepPoint');

test('named infield and deep positions agree with the displayed inner circle', () => {
  expect(isOutsideFieldCircle(point)).toBe(false);
  expect(isOutsideFieldCircle(deepPoint)).toBe(true);
});

test('T20 and ODI field restrictions change at their specified powerplay boundaries', () => {
  expect(getFieldViolations({ positions: positions('powerplay'), matchTypeKey: 't20', balls: 0 })).toEqual([]);
  expect(getFieldViolations({ positions: positions('deathOvers'), matchTypeKey: 't20', balls: 35 }))
    .toContain('At most 2 fielders may be outside the circle.');
  expect(getFieldViolations({ positions: positions('deathOvers'), matchTypeKey: 't20', balls: 36 })).toEqual([]);
  expect(getFieldViolations({ positions: positions('deathOvers'), matchTypeKey: 'ODI', balls: 120 }))
    .toContain('At most 4 fielders may be outside the circle.');
  expect(getFieldViolations({ positions: positions('deathOvers'), matchTypeKey: 'ODI', balls: 240 })).toEqual([]);
});

test('leg-side restrictions apply relative to the batter and Test matches have no circle quota', () => {
  expect(getFieldViolations({ positions: positions('newBall'), matchTypeKey: 't20', balls: 0, battingHand: 'left' }))
    .toContain('At most 5 fielders may be on the leg side.');
  expect(getFieldViolations({ positions: positions('boundary'), matchTypeKey: 'test', balls: 0 }))
    .not.toContain('At most 2 fielders may be outside the circle.');
  const tooManyBehind = [
    'wicketkeeper', 'shortLeg', 'shortMidWicket', 'shortFineLeg', 'cover',
    'point', 'midOff', 'midOn', 'midWicket', 'squareLeg',
  ];
  expect(getFieldViolations({ positions: tooManyBehind, matchTypeKey: 'test' }))
    .toContain('At most 2 fielders may be behind the popping crease on the leg side.');
});

test('the AI chooses a legal field before a left-handed batter plays', () => {
  const selected = selectLegalOpponentField({
    inningState: { balls: 0 },
    matchType: { over: 20 },
    matchTypeKey: 't20',
    battingHand: 'left',
  });
  expect(getFieldViolations({ positions: positions(selected), matchTypeKey: 't20', balls: 0, battingHand: 'left' })).toEqual([]);
});
