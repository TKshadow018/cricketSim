import { getEffectiveBowlingVariation, normalizeBowlingTactics } from './bowlingTactics';
import { getBallEventLabel } from './ballEventLabel';

export const buildBowlingBallEvent = ({
  inningState,
  outcome,
  striker,
  bowler,
  battingTactics,
  bowlingTactics,
  isUserBowling,
  opponentFieldPreset,
  realismDelivery,
}) => {
  const completedBalls = Number(inningState?.balls) || 0;
  const isLegalDelivery = Boolean(outcome?.isLegalDelivery);
  const token = outcome?.token || '0';
  const resultLabel = getBallEventLabel(outcome);
  const fieldTactics = bowlingTactics?.fieldPreset === 'custom'
    ? normalizeBowlingTactics(bowlingTactics)
    : bowlingTactics;

  return {
    overNumber: Math.floor(completedBalls / 6) + 1,
    ballNumber: isLegalDelivery ? (completedBalls % 6) + 1 : null,
    isLegalDelivery,
    token,
    resultLabel,
    runs: Number(outcome?.runs) || 0,
    extras: Number(outcome?.extraRuns) || 0,
    extraBreakdown: {
      wide: Number(outcome?.extras?.wide) || (token === 'wide' ? Number(outcome?.extraRuns) || 0 : 0),
      noBall: Number(outcome?.extras?.noBall) || (token === 'nb' ? 1 : 0),
      bye: Number(outcome?.extras?.bye) || 0,
      legBye: Number(outcome?.extras?.legBye) || 0,
    },
    completedRuns: outcome?.completedRuns ?? (token === 'wide'
      ? Math.max(0, (Number(outcome?.extraRuns) || 0) - 1)
      : (Number(outcome?.runs) || 0) + (Number(outcome?.extras?.bye) || 0) + (Number(outcome?.extras?.legBye) || 0)),
    isWicket: Boolean(outcome?.isWicket),
    ...(outcome?.dismissal ? { dismissal: { ...outcome.dismissal } } : {}),
    ...(realismDelivery ? {
      execution: {
        batting: { ...realismDelivery.batting },
        bowling: { ...realismDelivery.bowling },
        intendedBatting: { ...realismDelivery.intendedBatting },
        intendedBowling: { ...realismDelivery.intendedBowling },
        fieldPositions: [...realismDelivery.fieldPositions],
      },
    } : {}),
    bowler: bowler?.name || '',
    striker: striker?.name || '',
    ...(opponentFieldPreset ? { opponentFieldPreset } : {}),
    tactics: isUserBowling && bowlingTactics
      ? {
          overPlan: bowlingTactics.overPlan,
          fieldPreset: fieldTactics.fieldPreset,
          ...(fieldTactics.fieldPreset === 'custom'
            ? { fieldPositions: [...fieldTactics.fieldPositions] }
            : {}),
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
  opponentFieldPreset,
  realismDelivery,
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
    opponentFieldPreset,
    realismDelivery,
  }),
].slice(-60);
