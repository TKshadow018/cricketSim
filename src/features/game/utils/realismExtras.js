import { getRealismExtrasProfile } from './realismCalibration';
import { sampleDismissal } from './dismissalSampling';

const totalCounts = (counts) => Object.values(counts).reduce((sum, count) => sum + count, 0);
const pick = (counts, random) => {
  let roll = random() * totalCounts(counts);
  for (const [value, count] of Object.entries(counts)) {
    roll -= count;
    if (roll < 0) return Number(value);
  }
  throw new Error('Could not sample a valid extras distribution.');
};

const sampleRunOut = ({ inningState, bowlingSide, bowler, random }) =>
  sampleDismissal({ fraction: random(), freeHitRunOut: true, inningState, bowlingSide, bowler });

export const sampleRealismExtra = ({ token, matchTypeKey, inningState, bowlingSide = [], bowler, random = Math.random }) => {
  const profile = getRealismExtrasProfile(matchTypeKey);
  if (token === '0') {
    const byeCount = totalCounts(profile.byeRuns);
    const legByeCount = totalCounts(profile.legByeRuns);
    const roll = random() * profile.dotCount;
    if (roll >= byeCount + legByeCount) return null;
    const isBye = roll < byeCount;
    const kind = isBye ? 'bye' : 'legBye';
    const runs = pick(isBye ? profile.byeRuns : profile.legByeRuns, random);
    return { token: kind, runs: 0, extraRuns: runs, extras: { [kind]: runs }, completedRuns: runs, isWicket: false, isLegalDelivery: true };
  }
  if (token === 'nb') {
    const runs = pick(profile.noBallBatRuns, random);
    const isRunOut = runs < 4 && random() * totalCounts(profile.noBallBatRuns) < profile.noBallRunOuts;
    return {
      token: 'nb',
      runs,
      extraRuns: 1,
      extras: { noBall: 1 },
      completedRuns: runs,
      isWicket: isRunOut,
      isLegalDelivery: false,
      ...(isRunOut ? { dismissal: sampleRunOut({ inningState, bowlingSide, bowler, random }) } : {}),
    };
  }
  if (token === 'wide') {
    const runs = pick(profile.wideRuns, random);
    const roll = random() * totalCounts(profile.wideRuns);
    const runOut = profile.wideDismissals.runOut || 0;
    const stumped = profile.wideDismissals.stumped || 0;
    const hitWicket = profile.wideDismissals.hitWicket || 0;
    let dismissal;
    if (runs < 5 && roll < runOut) {
      dismissal = sampleRunOut({ inningState, bowlingSide, bowler, random });
    } else if (runs === 1 && !inningState.freeHitArmed && roll < runOut + stumped) {
      const keeper = bowlingSide.find((player) => player?.isWicketKeeper);
      dismissal = { type: 'stumped', batterIndex: inningState.strikerIndex, ...(keeper?.name ? { fielderName: keeper.name } : {}) };
    } else if (runs === 1 && !inningState.freeHitArmed && roll < runOut + stumped + hitWicket) {
      dismissal = { type: 'hitWicket', batterIndex: inningState.strikerIndex };
    }
    return {
      token: 'wide',
      runs: 0,
      extraRuns: runs,
      extras: { wide: runs },
      completedRuns: runs - 1,
      isWicket: Boolean(dismissal),
      isLegalDelivery: false,
      ...(dismissal ? { dismissal } : {}),
    };
  }
  throw new Error(`Unsupported extra outcome: ${token}`);
};
