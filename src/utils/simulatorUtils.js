import { battingAction, bowlingAction } from '../gameData/actionType';
import { matchStatusEnum } from '../gameData/matchStatusEnum';
import { outfieldType, pitchType } from '../gameData/matchCondition';

export const stageOrder = [
  matchStatusEnum.intro,
  matchStatusEnum.ChooseGameMode,
  matchStatusEnum.ChooseSeriesLength,
  matchStatusEnum.ChooseMatchType,
  matchStatusEnum.ChooseOwnTeam,
  matchStatusEnum.ChooseOpponent,
  matchStatusEnum.SetupTournamentFixtures,
  matchStatusEnum.ChooseMatchLocation,
  matchStatusEnum.ChooseStadium,
  matchStatusEnum.ChooseCommentator,
  matchStatusEnum.TossTime,
  matchStatusEnum.TossResult,
  matchStatusEnum.ChooseOwnPlayingXI,
  matchStatusEnum.ChooseOpponentPlayingXI,
  matchStatusEnum.TeamOneBat,
  matchStatusEnum.TeamTwoBat,
  matchStatusEnum.MatchEnd,
  matchStatusEnum.SeriesSummary,
  matchStatusEnum.TournamentChampion,
];

export const battingActionList = [
  { key: battingAction.defence, label: 'Defend' },
  { key: battingAction.normal, label: 'Normal' },
  { key: battingAction.hitBig, label: 'Hit Big' },
  { key: battingAction.superShot, label: 'Super Shot' },
  { key: battingAction.freeHit, label: 'Free Hit' },
];

export const bowlingActionList = [
  { key: bowlingAction.normal, label: 'Normal' },
  { key: bowlingAction.tryForWicket, label: 'Wicket Ball' },
  { key: bowlingAction.saveRun, label: 'Save Run' },
  { key: bowlingAction.specialBowl, label: 'Special Bowl' },
];

export const matchVisual = {
  micro: '⚡',
  mini: '🏃',
  t10: '🎯',
  t20: '🔥',
  ODI: '🏆',
  test: '👑',
  practiceTestMicro: '🎓',
  practiceTestMini: '🎓',
};

export const randomFrom = (arr = []) => arr[Math.floor(Math.random() * arr.length)];

export const replaceName = (line, striker, partner) =>
  line.replaceAll('$$$$$', striker || 'Batsman').replaceAll('#####', partner || 'Runner');

export const getTopOpenerIndices = (players = []) => {
  const sorted = [...players]
    .map((player, index) => ({
      index,
      score:
        (player?.battingAggresion || 0) +
        (player?.abilityToPlayPaceBall || 0) +
        (player?.abilityToPlaySpinBall || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.index);

  if (sorted.length >= 2) {
    return [sorted[0], sorted[1]];
  }

  if (sorted.length === 1) {
    return [sorted[0], sorted[0]];
  }

  return [0, 1];
};

export const getNextBatterIndex = (players = [], outIndices = [], occupied = []) => {
  const outSet = new Set(outIndices);
  const occupiedSet = new Set(occupied.filter((index) => index !== null && index !== undefined));

  for (let index = 0; index < players.length; index += 1) {
    if (!outSet.has(index) && !occupiedSet.has(index)) {
      return index;
    }
  }

  return -1;
};

export const getBestBowlerIndex = (players = [], excludeIndex = null) => {
  if (!players.length) {
    return 0;
  }

  const sorted = [...players]
    .map((player, index) => ({
      index,
      score: (player?.paceAbility || 0) + (player?.spinAbility || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.index);

  if (excludeIndex !== null) {
    const alternative = sorted.find((index) => index !== excludeIndex);
    if (alternative !== undefined) {
      return alternative;
    }
  }

  return sorted[0] ?? 0;
};

export const isEligibleBowler = (player) =>
  !player?.isWicketKeeper && ((player?.paceAbility || 0) >= 30 || (player?.spinAbility || 0) >= 30);

export const getMaxOversPerBowler = (totalOvers) => Math.max(1, Math.floor(totalOvers / 5));

export const canSelectNextBatter = (inningState, playerIndex) => {
  const isOut = inningState.outBatterIndices.includes(playerIndex);
  const isCurrentBatter =
    playerIndex === inningState.strikerIndex || playerIndex === inningState.nonStrikerIndex;

  return !isOut && !isCurrentBatter;
};

export const canSelectBowler = ({ inningState, bowlerIndex, maxOversPerBowler }) => {
  const isLastOverBowler = inningState.lastOverBowlerIndex === bowlerIndex;
  const balls = inningState.bowlingStats[bowlerIndex]?.balls || 0;
  const hitOverLimit = balls >= maxOversPerBowler * 6;

  return !isLastOverBowler && !hitOverLimit;
};

export const createBattingStats = (players = []) =>
  players.map(() => ({
    runs: 0,
    balls: 0,
    isOut: false,
    outByBowler: '',
    outAtScore: '',
    outAtBall: '',
    superShotPaceUnlocked: 0,
    superShotSpinUnlocked: 0,
    superShotPaceUsed: 0,
    superShotSpinUsed: 0,
    superShotPaceProgress: 0,
    superShotSpinProgress: 0,
  }));

export const createBowlingStats = (players = []) =>
  players.map(() => ({
    balls: 0,
    runsConceded: 0,
    wickets: 0,
  }));

export const formatBallProgress = (balls) => {
  if (!balls) {
    return '0.0';
  }

  const completedOvers = Math.floor((balls - 1) / 6);
  const ballInOver = ((balls - 1) % 6) + 1;
  return `${completedOvers}.${ballInOver}`;
};

export const oversDisplay = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

export const isInningsReadyForNextBall = (inningState, maxBalls) => {
  if (inningState.balls >= maxBalls || inningState.wickets >= 10) {
    return false;
  }

  if (inningState.needsOpeners || inningState.waitingForNextBatter || inningState.waitingForNextBowler) {
    return false;
  }

  if (inningState.strikerIndex === null || inningState.nonStrikerIndex === null) {
    return false;
  }

  if (inningState.currentBowlerIndex === null) {
    return false;
  }

  return true;
};

export const getOpponentDecision = (condition) => {
  const pitchProfile = pitchType[condition.pitch] || pitchType.sporting;
  const outfieldProfile = outfieldType[condition.outfield] || outfieldType.lushGreen;

  const battingIndex =
    pitchProfile.goodForBatting * 0.75 +
    outfieldProfile.boundaryScoring * 0.45 +
    (condition.weather === 'sunny' ? 1.2 : 0) -
    (condition.weather === 'rainy' ? 1 : 0) -
    (condition.weather === 'stormy' ? 1.8 : 0);

  return battingIndex >= 7.2 ? 'bat' : 'bowl';
};

export const resolveResultSummary = ({
  firstInningsScore,
  secondInningsScore,
  secondInningsWickets,
  firstInningsTeamName,
  secondInningsTeamName,
}) => {
  if (secondInningsScore > firstInningsScore) {
    const wicketsLeft = 10 - secondInningsWickets;
    return `${secondInningsTeamName} won by ${wicketsLeft} wickets`;
  }

  if (secondInningsScore < firstInningsScore) {
    const runMargin = firstInningsScore - secondInningsScore;
    return `${firstInningsTeamName} won by ${runMargin} runs`;
  }

  return 'The match is tied. What a thriller!';
};
