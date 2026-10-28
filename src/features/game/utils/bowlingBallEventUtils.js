import { getEffectiveBowlingVariation } from './bowlingTactics';

export const buildBowlingBallEvent = ({
  inningState,
  outcome,
  striker,
  bowler,
  battingTactics,
  bowlingTactics,
  isUserBowling,
}) => {
  const completedBalls = Number(inningState?.balls) || 0;
  const isLegalDelivery = Boolean(outcome?.isLegalDelivery);
  const token = outcome?.token || '0';
  const resultLabel = outcome?.isWicket
    ? 'W'
    : token === 'wide'
      ? `WD +${Number(outcome?.extraRuns) || 1}`
      : token === 'nb'
        ? `NB +${Number(outcome?.extraRuns) || 1}`
        : String(Number(outcome?.runs) || 0);

  return {
    overNumber: Math.floor(completedBalls / 6) + 1,
    ballNumber: isLegalDelivery ? (completedBalls % 6) + 1 : null,
    isLegalDelivery,
    token,
    resultLabel,
    runs: Number(outcome?.runs) || 0,
    extras: Number(outcome?.extraRuns) || 0,
    isWicket: Boolean(outcome?.isWicket),
    bowler: bowler?.name || '',
    striker: striker?.name || '',
    tactics: isUserBowling && bowlingTactics
      ? {
          overPlan: bowlingTactics.overPlan,
          fieldPreset: bowlingTactics.fieldPreset,
          line: bowlingTactics.line,
          length: bowlingTactics.length,
          variation: getEffectiveBowlingVariation(bowlingTactics, bowler),
        }
      : null,
    battingTactics: battingTactics
      ? {
          approach: battingTactics.approach,
          shot: battingTactics.shot,
          target: battingTactics.target,
        }
      : null,
    specialShot: Boolean(battingTactics?.specialShot),
    specialDelivery: Boolean(isUserBowling && bowlingTactics?.specialDeliveryArmed),
  };
};

export const buildNextBallHistory = ({
  inningState,
  outcome,
  striker,
  bowler,
  battingTactics,
  bowlingTactics,
  isUserBatting,
  isUserBowling,
  specialShot,
}) => [
  ...(Array.isArray(inningState?.ballHistory) ? inningState.ballHistory : []),
  buildBowlingBallEvent({
    inningState,
    outcome,
    striker,
    bowler,
    battingTactics: isUserBatting && battingTactics ? { ...battingTactics, specialShot } : null,
    bowlingTactics,
    isUserBowling,
  }),
].slice(-60);
