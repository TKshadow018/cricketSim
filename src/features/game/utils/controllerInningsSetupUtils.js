import {
  createBattingStats,
  createBowlingStats,
  getMaxOversPerBowler,
  getNextBatterIndex,
  getTopOpenerIndices,
  isEligibleBowler,
} from '../../../utils/simulatorUtils';
import { buildInitialInnings } from '../gameSlice';

export const getBestEligibleBowlerIndex = (players = [], excludeIndex = null) => {
  const eligibleIndices = players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => isEligibleBowler(player))
    .map(({ index }) => index);

  if (!eligibleIndices.length) {
    return null;
  }

  const rankedIndices = [...eligibleIndices].sort((left, right) => {
    const leftScore = (players[left]?.paceAbility || 0) + (players[left]?.spinAbility || 0);
    const rightScore = (players[right]?.paceAbility || 0) + (players[right]?.spinAbility || 0);
    return rightScore - leftScore;
  });

  const withoutExcluded = rankedIndices.find((index) => index !== excludeIndex);
  return withoutExcluded ?? rankedIndices[0];
};

export const selectComputerBowler = ({ inningState, bowlingSide, previousBowlerIndex, overs }) => {
  const maxOversPerBowler = getMaxOversPerBowler(overs);
  const completedOverBowlerIndices = inningState.completedOverBowlerIndices || [];
  const nextOverNumber = completedOverBowlerIndices.length + 1;

  const underLimitIndices = bowlingSide
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => isEligibleBowler(player))
    .filter(({ index }) => {
      const balls = inningState.bowlingStats[index]?.balls || 0;
      return balls < maxOversPerBowler * 6;
    })
    .map(({ index }) => index);

  const validBowlerIndices = underLimitIndices.filter((index) => index !== previousBowlerIndex);

  if (!validBowlerIndices.length) {
    if (underLimitIndices.length) {
      return underLimitIndices[Math.floor(Math.random() * underLimitIndices.length)];
    }
    return null;
  }

  const randomFromIndices = (indices) => indices[Math.floor(Math.random() * indices.length)];
  const paceCandidates = validBowlerIndices.filter((index) => {
    const player = bowlingSide[index];
    return (player?.paceAbility || 0) >= 30 && (player?.paceAbility || 0) >= (player?.spinAbility || 0);
  });

  const bowlerOne = completedOverBowlerIndices[0];
  const bowlerTwo = completedOverBowlerIndices[1];
  const thirdOverBowler = completedOverBowlerIndices[2];

  if (nextOverNumber === 1) {
    return paceCandidates.length ? randomFromIndices(paceCandidates) : randomFromIndices(validBowlerIndices);
  }

  if (nextOverNumber === 2) {
    const pool = validBowlerIndices.filter((index) => index !== bowlerOne);
    return pool.length ? randomFromIndices(pool) : randomFromIndices(validBowlerIndices);
  }

  if (nextOverNumber === 3) {
    const roll = Math.floor(Math.random() * 3) + 1;
    if ((roll === 2 || roll === 3) && validBowlerIndices.includes(bowlerOne)) {
      return bowlerOne;
    }
    const alternatives = validBowlerIndices.filter((index) => index !== bowlerOne && index !== bowlerTwo);
    return alternatives.length ? randomFromIndices(alternatives) : randomFromIndices(validBowlerIndices);
  }

  if (nextOverNumber === 4) {
    const roll = Math.floor(Math.random() * 4) + 1;
    if ((roll === 2 || roll === 3) && validBowlerIndices.includes(bowlerTwo)) {
      return bowlerTwo;
    }
    if (roll === 1) {
      const alternatives = validBowlerIndices.filter((index) => index !== thirdOverBowler && index !== bowlerTwo);
      if (alternatives.length) {
        return randomFromIndices(alternatives);
      }
    }
    return randomFromIndices(validBowlerIndices);
  }

  return randomFromIndices(validBowlerIndices);
};

export const buildPreparedInnings = ({ battingSide, bowlingSide, isUserBatting, isUserBowling, overs }) => {
  const innings = buildInitialInnings();
  innings.battingStats = createBattingStats(battingSide);
  innings.bowlingStats = createBowlingStats(bowlingSide);
  const eligibleBowlerIndices = bowlingSide
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => isEligibleBowler(player))
    .map(({ index }) => index);

  if (isUserBatting) {
    innings.needsOpeners = true;
    innings.lastEvent = 'Choose your opening pair.';
  } else {
    const [strikerIndex, nonStrikerIndex] = getTopOpenerIndices(battingSide);
    innings.strikerIndex = strikerIndex;
    innings.nonStrikerIndex = nonStrikerIndex;
    innings.battingOrderIndices = Array.from(
      new Set([strikerIndex, nonStrikerIndex].filter((index) => index !== null && index !== undefined))
    );
    innings.nextBatterIndex = getNextBatterIndex(battingSide, [], [strikerIndex, nonStrikerIndex]);
  }

  if (isUserBowling) {
    if (eligibleBowlerIndices.length > 0) {
      innings.waitingForNextBowler = true;
      innings.currentBowlerIndex = null;
      innings.lastEvent = isUserBatting ? innings.lastEvent : 'Choose your opening bowler.';
    } else {
      innings.waitingForNextBowler = false;
      innings.currentBowlerIndex = getBestEligibleBowlerIndex(bowlingSide);
    }
  } else {
    innings.waitingForNextBowler = false;
    const openingBowlerIndex = selectComputerBowler({
      inningState: innings,
      bowlingSide,
      previousBowlerIndex: null,
      overs,
    });
    innings.currentBowlerIndex = openingBowlerIndex ?? getBestEligibleBowlerIndex(bowlingSide);
  }

  return innings;
};
