import { getFieldCoverage, getFieldingTacticShift, selectOpponentField } from './opponentField';

const t20 = { matchTypeKey: 't20', matchType: { over: 20 } };

test('selects fields from innings phase and chase situation without using the selected shot', () => {
  expect(selectOpponentField({ ...t20, inningState: { balls: 0, wickets: 0 } })).toBe('powerplay');
  expect(selectOpponentField({ ...t20, inningState: { balls: 36, wickets: 2 } })).toBe('middleOvers');
  expect(selectOpponentField({ ...t20, inningState: { balls: 72, wickets: 7 } })).toBe('attacking');
  expect(selectOpponentField({ ...t20, inningState: { balls: 96, wickets: 2 } })).toBe('deathOvers');
  expect(selectOpponentField({ ...t20, inningState: { balls: 115, score: 99 }, target: 100 })).toBe('defendSingle');
  expect(selectOpponentField({ ...t20, inningState: { balls: 90, score: 60 }, target: 130 })).toBe('deathOvers');
  expect(selectOpponentField({ ...t20, inningState: { balls: 90, score: 60 }, target: 80 })).toBe('middleOvers');
  expect(selectOpponentField({ matchTypeKey: 'ODI', matchType: { over: 50 }, inningState: { balls: 54 } }))
    .toBe('powerplay');
  expect(selectOpponentField({ matchTypeKey: 'test', matchType: { over: 90 }, inningState: { balls: 30 } }))
    .toBe('newBall');
  expect(selectOpponentField({ matchTypeKey: 'test', matchType: { over: 90 }, inningState: { balls: 120 } }))
    .toBe('balanced');
});

test('recognizes deep and infield coverage in the intended sector', () => {
  expect(getFieldCoverage('boundary', 'cover').deep).toContain('deepCover');
  expect(getFieldCoverage('attacking', 'cover').inner).toContain('cover');
  expect(getFieldCoverage('boundary', 'straight').deep).toEqual(expect.arrayContaining(['longOff', 'longOn']));
  expect(getFieldCoverage('boundary', 'midWicket').deep).toContain('deepMidWicket');
  expect(getFieldCoverage('boundary', 'cover').deep).not.toContain('deepMidWicket');
  expect(getFieldCoverage('powerplay', 'point').deep).toEqual([]);
  expect(getFieldCoverage('powerplay', 'thirdMan').deep).toContain('thirdMan');
});

test.each([
  ['thirdMan', 'thirdMan'],
  ['point', 'deepPoint'],
  ['cover', 'deepCover'],
  ['midOff', 'longOff'],
  ['straight', 'longOff'],
  ['midOn', 'longOn'],
  ['midWicket', 'deepMidWicket'],
  ['squareLeg', 'deepSquareLeg'],
  ['fineLeg', 'deepFineLeg'],
])('maps %s shots to the %s boundary fielder', (target, position) => {
  expect(getFieldCoverage('boundary', target).deep).toContain(position);
  expect(getFieldingTacticShift('boundary', { shot: 'drive', target })['4']).toBe(-2);
});

test('selects without consuming randomness or reacting to the pending batting call', () => {
  const random = jest.spyOn(Math, 'random');
  const situation = { ...t20, inningState: { balls: 40, score: 60, wickets: 2 } };
  expect(selectOpponentField({ ...situation, battingTactics: { target: 'cover' } }))
    .toBe(selectOpponentField({ ...situation, battingTactics: { target: 'fineLeg' } }));
  expect(random).not.toHaveBeenCalled();
  random.mockRestore();
});

test('applies bounded sector-specific shifts and only challenges airborne sixes', () => {
  expect(getFieldingTacticShift('boundary', { shot: 'drive', target: 'cover' }))
    .toEqual({ 2: 1, 4: -2 });
  expect(getFieldingTacticShift('attacking', { shot: 'drive', target: 'cover' }))
    .toEqual({ 1: -1 });
  expect(getFieldingTacticShift('boundary', { shot: 'loft', target: 'cover' }))
    .toEqual({ 2: 1, 4: -2, 6: -1, W: 1 });
  expect(getFieldingTacticShift('boundary', { shot: 'leave', target: 'cover' })).toEqual({});
  expect(getFieldingTacticShift(undefined, { shot: 'drive', target: 'cover' })).toEqual({});
});
