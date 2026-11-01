import { sampleRealismExtra } from './realismExtras';
import { getRealismBaseWeights } from './realismCalibration';

const inningState = { strikerIndex: 0, nonStrikerIndex: 1, freeHitArmed: false };
const bowlingSide = [{ name: 'Bowler' }, { name: 'Keeper', isWicketKeeper: true }, { name: 'Fielder' }];
const sequence = (...values) => {
  let index = 0;
  return () => values[index++] ?? 0.5;
};

test('realism uses the observed format and innings phase without abrupt boundary jumps', () => {
  const opening = getRealismBaseWeights('t20', 0);
  const middle = getRealismBaseWeights('t20', 8 * 6);
  const death = getRealismBaseWeights('t20', 18 * 6);
  expect(opening['0']).toBeGreaterThan(middle['0']);
  expect(death.W).toBeGreaterThan(middle.W);
  expect(middle['3']).toBeLessThan(1);
  expect(Math.abs(getRealismBaseWeights('t20', 36)['0'] - getRealismBaseWeights('t20', 35)['0'])).toBeLessThan(2);
  expect(getRealismBaseWeights('test', 0).nb).toBeGreaterThan(0);
});

test('realistic dots can produce byes and legal leg-byes', () => {
  const bye = sampleRealismExtra({ token: '0', matchTypeKey: 't20', inningState, random: () => 0 });
  expect(bye).toMatchObject({ token: 'bye', runs: 0, extraRuns: 1, extras: { bye: 1 }, isLegalDelivery: true });
  const legBye = sampleRealismExtra({
    token: '0', matchTypeKey: 't20', inningState, random: () => 1400 / 117855,
  });
  expect(legBye).toMatchObject({ token: 'legBye', extraRuns: 1, extras: { legBye: 1 } });
  expect(sampleRealismExtra({ token: '0', matchTypeKey: 't20', inningState, random: () => 0.9 })).toBeNull();
});

test('realistic no-balls can carry bat runs or a non-striker run-out', () => {
  const six = sampleRealismExtra({ token: 'nb', matchTypeKey: 't20', inningState, bowlingSide, random: sequence(0.99, 0.9) });
  expect(six).toMatchObject({ token: 'nb', runs: 6, extraRuns: 1, isLegalDelivery: false });
  const runOut = sampleRealismExtra({ token: 'nb', matchTypeKey: 't20', inningState, bowlingSide, random: sequence(0, 0, 0.9) });
  expect(runOut).toMatchObject({ token: 'nb', isWicket: true, dismissal: { type: 'runOut', batterIndex: 1 } });
});

test('a wide can include extra runs and stumping, but cannot stump on a free hit', () => {
  const wide = sampleRealismExtra({ token: 'wide', matchTypeKey: 't20', inningState, bowlingSide, random: sequence(0.999, 0.9) });
  expect(wide).toMatchObject({ token: 'wide', extraRuns: 5, extras: { wide: 5 }, completedRuns: 4 });
  const stumped = sampleRealismExtra({ token: 'wide', matchTypeKey: 't20', inningState, bowlingSide, random: sequence(0, 19 / 12838) });
  expect(stumped).toMatchObject({ isWicket: true, dismissal: { type: 'stumped', batterIndex: 0, fielderName: 'Keeper' } });
  const protectedWide = sampleRealismExtra({
    token: 'wide', matchTypeKey: 't20', inningState: { ...inningState, freeHitArmed: true },
    bowlingSide, random: sequence(0, 19 / 12838),
  });
  expect(protectedWide.isWicket).toBe(false);
});
