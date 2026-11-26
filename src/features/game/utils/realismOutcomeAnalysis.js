import { buildOutcomeAnalysis } from './controllerOutcomeUtils';
import { createRealismDelivery } from './realismTactics';
import { createSeededRandom } from './seededRandom';

export const buildExpectedRealismAnalysis = ({ input, isFirstInnings, firstInningsScore, targetScore, samples = 128 }) => {
  const random = createSeededRandom(408709).next;
  let first;
  const weights = {};
  const skillImpactDeltas = {};
  for (let index = 0; index < samples; index += 1) {
    const realismDelivery = createRealismDelivery({
      inningState: input.inningState,
      matchType: input.matchType,
      matchTypeKey: input.matchTypeKey,
      isFirstInnings,
      firstInningsScore,
      isUserBatting: input.isUserBatting,
      isUserBowling: input.isUserBowling,
      battingTactics: input.battingTactics,
      bowlingTactics: input.bowlingTactics,
      striker: input.striker,
      bowler: input.bowler,
      random,
      targetScore,
    });
    const result = buildOutcomeAnalysis({ ...input, realismDelivery });
    if (!first) first = result;
    result.outcomes.forEach((outcome) => {
      weights[outcome] = (weights[outcome] || 0) + result.weights[outcome] / samples;
      skillImpactDeltas[outcome] = (skillImpactDeltas[outcome] || 0) + result.skillImpactDeltas[outcome] / samples;
    });
  }
  return { ...first, weights, skillImpactDeltas };
};
