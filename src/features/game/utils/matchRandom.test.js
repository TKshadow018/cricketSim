import { beginMatchRandom } from './matchRandom';

test('a saved match random state resumes the same sequence and records its engine version', () => {
  const first = beginMatchRandom(null, () => 0.25);
  expect(first.snapshot()).toMatchObject({
    seed: 1073741824,
    state: 1073741824,
    algorithm: 'mulberry32-v1',
    engineVersion: 'match-engine-v1',
  });
  first.next();
  const saved = first.snapshot();
  const expected = [first.next(), first.next()];
  const resumed = beginMatchRandom(saved);
  expect([resumed.next(), resumed.next()]).toEqual(expected);
});

test('unknown saved random algorithms are rejected instead of silently rerolling', () => {
  expect(() => beginMatchRandom({ seed: 1, state: 2, algorithm: 'unknown', engineVersion: 'match-engine-v1' })).toThrow();
});
