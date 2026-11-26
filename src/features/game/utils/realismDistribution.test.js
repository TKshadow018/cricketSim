import { normalizeRealismWeights } from './realismDistribution';

test('realism probabilities are finite and sum to exactly 100 within floating-point tolerance', () => {
  const weights = normalizeRealismWeights({ 0: 40.1, 1: 20.2, W: 5.3 }, ['0', '1', 'W'], false);
  expect(Object.values(weights).every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
  expect(Object.values(weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 10);
});

test('invalid or empty distributions fail explicitly rather than becoming dot balls', () => {
  expect(() => normalizeRealismWeights({ 0: 0, W: 0 }, ['0', 'W'], false)).toThrow();
  expect(() => normalizeRealismWeights({ 0: NaN, W: 1 }, ['0', 'W'], false)).toThrow();
});
