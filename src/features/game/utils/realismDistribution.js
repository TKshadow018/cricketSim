export const normalizeRealismWeights = (weights, outcomes, freeHit) => {
  const result = Object.fromEntries(outcomes.map((key) => {
    const value = Number(weights[key] ?? 0);
    if (!Number.isFinite(value)) throw new Error(`Invalid outcome weight: ${key}`);
    return [key, Math.max(0, value)];
  }));
  if (freeHit) {
    result.runOut = Math.max(0.25, result.W * 0.1);
    result.W = 0;
  }
  const total = outcomes.reduce((sum, key) => sum + result[key], 0);
  if (total <= 0) throw new Error('The outcome distribution has no positive weight.');
  return Object.fromEntries(outcomes.map((key) => [key, result[key] * 100 / total]));
};
