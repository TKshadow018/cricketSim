import { createSeededRandom } from './seededRandom';

const algorithm = 'mulberry32-v1';
const engineVersion = 'match-engine-v1';

export const beginMatchRandom = (saved, initialRandom = Math.random) => {
  if (saved && (saved.algorithm !== algorithm || saved.engineVersion !== engineVersion)) {
    throw new Error('Unsupported saved match random algorithm or engine version.');
  }
  const draw = saved ? null : initialRandom();
  if (!saved && (!Number.isFinite(draw) || draw < 0 || draw >= 1)) {
    throw new RangeError('Random draw must be in [0, 1).');
  }
  const seed = saved ? saved.seed : Math.floor(draw * 4294967296);
  createSeededRandom(seed);
  const generator = createSeededRandom(saved ? saved.state : seed);
  return {
    next: generator.next,
    snapshot: () => ({ seed, state: generator.getState(), algorithm, engineVersion }),
  };
};
