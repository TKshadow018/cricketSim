import { simulateHeadlessMatch } from '../../src/features/game/utils/headlessMatch';
import { simulateHeadlessTestMatch } from '../../src/features/game/utils/headlessTestMatch';
import { createSeededRandom } from '../../src/features/game/utils/seededRandom';
import { summarizeSimulation } from './simulationMetrics.cjs';
import { bootstrapIntervals, summarizeMetrics } from './statistics.cjs';
import { gzipSync } from 'zlib';

const [format, ruleset, countText = '100', seedText = '20261101'] = process.argv.slice(2);
const count = Number(countText);
const seed = Number(seedText);
if (!['t20', 'odi', 'test'].includes(format) || !['arcade', 'realism'].includes(ruleset) ||
    !Number.isInteger(count) || count < 1) {
  throw new Error('Usage: benchmark.cjs <t20|odi|test> <arcade|realism> [matches] [seed]');
}

const roster = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 70,
  paceAbility: index < 6 ? 70 : 20,
  spinAbility: 20,
  isWicketKeeper: index === 10,
}));
const playersA = roster('A');
const playersB = roster('B');
const random = createSeededRandom(seed).next;
const matches = [];
let maxRawBytes = 0;
let maxGzipBytes = 0;
for (let index = 0; index < count; index += 1) {
  const options = {
    teamA: 'A',
    teamB: 'B',
    playersA,
    playersB,
    format,
    ruleset,
    seed: Math.floor(random() * 4294967296),
  };
  const result = format === 'test'
    ? simulateHeadlessTestMatch({ ...options, days: 5 })
    : simulateHeadlessMatch(options);
  const snapshot = JSON.stringify(format === 'test'
    ? result.testMatch
    : { firstInnings: result.firstInnings, secondInnings: result.secondInnings });
  maxRawBytes = Math.max(maxRawBytes, Buffer.byteLength(snapshot));
  maxGzipBytes = Math.max(maxGzipBytes, gzipSync(snapshot).length);
  matches.push(summarizeSimulation(result, format));
}
console.log(JSON.stringify({
  format,
  ruleset,
  seed,
  assumptions: 'Equal teams, 70 batting/bowling ability, sporting pitch, lush outfield and cloudy weather.',
  metrics: summarizeMetrics(matches),
  confidence95: bootstrapIntervals(matches),
  stateSize: { maxRawBytes, maxGzipBytes },
}, null, 2));
