import { buildScorecard, formatOvers, shuffleArray } from "./controllerCommonUtils";

import { randomInt } from "./careerPlayerDataUtils";

import { formatBallsRange } from "./careerSeasonScheduleUtils";

export const buildCreatedPlayerMatchContribution = (format) => {
  if (format === 'firstClass') {
    return {
      runs: randomInt(0, 180),
      balls: randomInt(20, 220),
      outs: Math.random() < 0.75 ? 1 : 0,
      wickets: randomInt(0, 4),
      ballsBowled: randomInt(0, 72),
      runsConceded: randomInt(0, 90),
    };
  }
  if (format === 'odi') {
    return {
      runs: randomInt(0, 140),
      balls: randomInt(5, 120),
      outs: Math.random() < 0.8 ? 1 : 0,
      wickets: randomInt(0, 5),
      ballsBowled: randomInt(0, 60),
      runsConceded: randomInt(0, 80),
    };
  }
  return {
    runs: randomInt(0, 110),
    balls: randomInt(1, 70),
    outs: Math.random() < 0.85 ? 1 : 0,
    wickets: randomInt(0, 4),
    ballsBowled: randomInt(0, 24),
    runsConceded: randomInt(0, 50),
  };
};

const allocateTotals = (total, count, weights = []) => {
  if (!count) {
    return [];
  }

  const safeWeights = Array.from({ length: count }, (_, index) => Math.max(1, Number(weights[index])));
  const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0);
  const values = safeWeights.map((weight) => Math.max(0, Math.floor((total * weight) / weightSum)));
  let remainder = total - values.reduce((sum, value) => sum + value, 0);

  while (remainder > 0) {
    const index = randomInt(0, count - 1);
    values[index] += 1;
    remainder -= 1;
  }

  return values;
};

const buildSyntheticInningsRows = ({ players = [], score = 0, wickets = 0, format = 't20', bowlingPlayers = null }) => {
  const battingPlayers = (players || [])
    .slice(0, 11)
    .sort(
      (left, right) =>
        Number(right?.battingOrderCoeff || 0) - Number(left?.battingOrderCoeff || 0) ||
        ((Number(right?.abilityToPlayPaceBall || 0) + Number(right?.abilityToPlaySpinBall || 0)) -
          (Number(left?.abilityToPlayPaceBall || 0) + Number(left?.abilityToPlaySpinBall || 0)))
    );
  const potentialBowlers = Array.isArray(bowlingPlayers) && bowlingPlayers.length ? [...bowlingPlayers] : [...battingPlayers];
  const battingWeights = battingPlayers.map((player) => {
    const battingSkill = ((Number(player.abilityToPlayPaceBall || 0) + Number(player.abilityToPlaySpinBall || 0)) / 2) || 1;
    return battingSkill + randomInt(1, 20);
  });
  const battingRuns = allocateTotals(score, battingPlayers.length, battingWeights);
  const [minBalls, maxBalls] = formatBallsRange[format] || [60, 120];
  const inningsBalls = randomInt(minBalls, maxBalls);
  const battingBalls = allocateTotals(inningsBalls, battingPlayers.length, battingWeights.map((weight) => weight + randomInt(0, 15)));
  const dismissedIndices = new Set(shuffleArray(battingPlayers.map((_, index) => index)).slice(0, Math.max(0, Math.min(wickets, battingPlayers.length - 1))));
  const battingBowlerNames = battingPlayers.map((player, index) => battingPlayers[(index + 1) % battingPlayers.length]?.name || player.name || 'Unknown');

  const battingRows = battingPlayers.map((player, index) => {
    const balls = battingBalls[index] || 0;
    const runs = battingRuns[index] || 0;
    const isOut = dismissedIndices.has(index);
    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
    return {
      playerId: player.id,
      name: player.name,
      playerType: player.playerType || '',
      isWicketKeeper: !!player.isWicketKeeper,
      paceAbility: player.paceAbility || 0,
      spinAbility: player.spinAbility || 0,
      abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
      runs,
      balls,
      strikeRate,
      dismissal: isOut
        ? `b ${battingBowlerNames[index] || 'Unknown'} @ ${runs}/${index + 1}`
        : balls > 0
          ? 'Not Out'
          : 'Yet to bat',
      isNotOut: !isOut && balls > 0,
    };
  });

  const bowlers = potentialBowlers
    .slice()
    .sort((left, right) => {
      const leftSkill = Math.max(Number(left.paceAbility || 0), Number(left.spinAbility || 0));
      const rightSkill = Math.max(Number(right.paceAbility || 0), Number(right.spinAbility || 0));
      return rightSkill - leftSkill;
    })
    .slice(0, Math.min(5, potentialBowlers.length));
  const bowlingWeights = bowlers.map((player) => Math.max(Number(player.paceAbility || 0), Number(player.spinAbility || 0)) + randomInt(1, 20));
  const bowlingBalls = allocateTotals(inningsBalls, bowlers.length, bowlingWeights);
  const bowlingWickets = allocateTotals(wickets, bowlers.length, bowlingWeights.map((weight) => weight + randomInt(0, 10)));
  const battingRunRate = inningsBalls > 0 ? score / inningsBalls : 0;
  const bowlingRows = bowlers.map((player, index) => {
    const balls = bowlingBalls[index] || 0;
    const wicketsForPlayer = bowlingWickets[index] || 0;
    const runsConceded = Math.max(0, Math.round(balls * battingRunRate + randomInt(-4, 4)));
    const overs = formatOvers(balls);
    const economy = balls > 0 ? ((runsConceded * 6) / balls).toFixed(2) : '0.00';
    const avgPerWicket = wicketsForPlayer > 0 ? (runsConceded / wicketsForPlayer).toFixed(2) : '-';

    return {
      playerId: player.id,
      name: player.name,
      playerType: player.playerType || '',
      isWicketKeeper: !!player.isWicketKeeper,
      paceAbility: player.paceAbility || 0,
      spinAbility: player.spinAbility || 0,
      abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
      overs,
      runsConceded,
      economy,
      avgPerWicket,
      wickets: wicketsForPlayer,
      isCurrent: index === 0,
    };
  });

  return { battingRows, bowlingRows, inningsBalls };
};

export const buildSimulatedInningsCard = ({ teamName, players = [], bowlingPlayers = null, score = 0, wickets = 0, format = 't20' }) => {
  const rows = buildSyntheticInningsRows({ players, score, wickets, format, bowlingPlayers });
  const [minBalls, maxBalls] = formatBallsRange[format] || [60, 120];
  const oversBalls = Math.max(minBalls, Math.min(Number(rows.inningsBalls || minBalls), maxBalls));
  return buildScorecard(
    `${teamName} Innings`,
    { score, wickets },
    rows,
    formatOvers(oversBalls)
  );
};

export const parseOversToBalls = (oversText = '0.0') => {
  const [overPart, ballPart] = String(oversText).split('.');
  const overs = Number(overPart || 0);
  const balls = Number(ballPart || 0);
  if (!Number.isFinite(overs) || !Number.isFinite(balls)) {
    return 0;
  }
  return overs * 6 + balls;
};

const markContribution = (teamMap, playerId, playerName, key, value = true) => {
  if (playerId !== undefined && playerId !== null) {
    const idKey = String(playerId);
    teamMap[idKey] = {
      ...(teamMap[idKey] || {}),
      [key]: value,
    };
  }

  if (playerName) {
    const nameKey = String(playerName);
    teamMap[nameKey] = {
      ...(teamMap[nameKey] || {}),
      [key]: value,
    };
  }
};

export const buildMatchContributionsFromScorecards = ({
  teamAName,
  teamBName,
  teamAScorecard,
  teamBScorecard,
}) => {
  const contributions = {
    [teamAName]: {},
    [teamBName]: {},
  };

  (teamAScorecard?.battingRows || []).forEach((row) => {
    if (Number(row?.balls || 0) > 0) {
      markContribution(contributions[teamAName], row?.playerId, row?.name, 'didBat', true);
    }
  });
  (teamBScorecard?.battingRows || []).forEach((row) => {
    if (Number(row?.balls || 0) > 0) {
      markContribution(contributions[teamBName], row?.playerId, row?.name, 'didBat', true);
    }
  });

  (teamBScorecard?.bowlingRows || []).forEach((row) => {
    if (parseOversToBalls(row?.overs || '0.0') > 0) {
      markContribution(contributions[teamAName], row?.playerId, row?.name, 'didBowl', true);
    }
  });
  (teamAScorecard?.bowlingRows || []).forEach((row) => {
    if (parseOversToBalls(row?.overs || '0.0') > 0) {
      markContribution(contributions[teamBName], row?.playerId, row?.name, 'didBowl', true);
    }
  });

  return contributions;
};

export const buildPlayerKey = (teamName, player) => `${teamName}::${player?.id ?? ''}::${player?.name || ''}`;
