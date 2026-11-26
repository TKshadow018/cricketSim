import { createSeededRandom } from './seededRandom';

test('seeded generators are repeatable and resume from a saved state', () => {
  const first = createSeededRandom(12345);
  const second = createSeededRandom(12345);
  const prefix = Array.from({ length: 10 }, () => first.next());
  expect(Array.from({ length: 10 }, () => second.next())).toEqual(prefix);
  const saved = first.getState();
  const expected = Array.from({ length: 10 }, () => first.next());
  expect(Array.from({ length: 10 }, () => createSeededRandom(saved).next()))
    .not.toEqual(expected);
  const resumed = createSeededRandom(saved);
  expect(Array.from({ length: 10 }, () => resumed.next())).toEqual(expected);
  expect(expected.every((value) => value >= 0 && value < 1)).toBe(true);
});

test.each([-1, 1.5, 4294967296, NaN])('rejects invalid PRNG state %s', (state) => {
  expect(() => createSeededRandom(state)).toThrow();
});
