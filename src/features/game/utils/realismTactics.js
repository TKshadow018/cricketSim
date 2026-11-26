import { fieldPositionList } from '../../../gameData/fieldPositionList';
import { getFieldPositions } from './bowlingField';
import { normalizeBattingTactics } from './battingTactics';
import { normalizeBowlingTactics } from './bowlingTactics';
import { isOutsideFieldCircle, selectLegalOpponentField } from './fieldingRules';

const sectors = ['thirdMan', 'point', 'cover', 'midOff', 'straight', 'midOn', 'midWicket', 'squareLeg', 'fineLeg'];
const sectorVectors = {
  thirdMan: [-118 / 162, 64 / 90],
  point: [-1, 0],
  cover: [-100 / 162, -58 / 90],
  midOff: [-17 / 162, -88 / 90],
  straight: [0, -1],
  midOn: [17 / 162, -88 / 90],
  midWicket: [100 / 162, -55 / 90],
  squareLeg: [1, 0],
  fineLeg: [105 / 162, 64 / 90],
};
const positionByKey = new Map(fieldPositionList.map((position) => [position.key, position]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getFieldCandidates = ({ positions, shot, handedness, bowlingSide, bowler }) => {
  const [targetX, targetY] = sectorVectors[shot.target] || sectorVectors.straight;
  const directionX = handedness === 'left' ? -targetX : targetX;
  const targetLength = Math.hypot(directionX, targetY);
  const fielders = bowlingSide.filter((player) => !player?.isWicketKeeper && player !== bowler);
  return positions
    .filter((key) => key !== 'wicketkeeper' && key !== 'bowler')
    .map((key, index) => {
      const position = positionByKey.get(key);
      if (!position) return null;
      const x = (position.x - 200) / 162;
      const y = (position.y - 110) / 90;
      const depth = Math.hypot(x, y);
      if (depth < 0.1) return null;
      const cosine = clamp((x * directionX + y * targetY) / (depth * targetLength), -1, 1);
      const skill = Number(fielders[index]?.fieldingAbility ?? 50);
      if (!Number.isFinite(skill)) throw new Error('Fielder ability must be a finite number.');
      return {
        position: key,
        player: fielders[index],
        angle: Math.acos(cosine),
        deep: isOutsideFieldCircle(position),
        strength: clamp(0.75 + skill / 200, 0.75, 1.25),
      };
    })
    .filter(Boolean);
};

export const getGeometricFieldShift = ({ positions = [], shot, handedness = 'right', bowlingSide = [], bowler }) => {
  if (!shot || shot.shot === 'leave') return {};
  const nearby = getFieldCandidates({ positions, shot, handedness, bowlingSide, bowler }).filter(({ angle }) => angle <= 0.5);
  const inner = nearby.filter((entry) => !entry.deep);
  const deep = nearby.filter((entry) => entry.deep);
  const innerStrength = inner.length ? Math.max(...inner.map(({ strength }) => strength)) : 0;
  const deepStrength = deep.length ? Math.max(...deep.map(({ strength }) => strength)) : 0;
  return {
    1: innerStrength ? -0.7 * innerStrength : 0.3,
    4: deepStrength ? -1.2 * deepStrength : 0.6,
    ...(deepStrength ? { 2: 0.7 * deepStrength } : {}),
    ...(deepStrength && ['loft', 'cutPull'].includes(shot.shot)
      ? { 6: -0.8 * deepStrength, W: 0.6 * deepStrength }
      : {}),
  };
};

export const getShotFielder = ({ positions = [], shot, handedness = 'right', bowlingSide = [], bowler }) => {
  if (!shot || shot.shot === 'leave') return null;
  const preferDeep = ['loft', 'cutPull'].includes(shot.shot);
  const nearby = getFieldCandidates({ positions, shot, handedness, bowlingSide, bowler })
    .filter(({ angle, player }) => angle <= 0.5 && player?.name)
    .sort((left, right) => Number(right.deep === preferDeep) - Number(left.deep === preferDeep) || left.angle - right.angle);
  return nearby[0] || null;
};

export const selectComputerBattingPlan = ({ inningState = {}, matchType = {}, target = null }) => {
  const balls = Number(inningState.balls) || 0;
  const scheduledBalls = matchType.unlimitedBowling
    ? Number(matchType.matchBallsRemaining) || 0
    : (Number(matchType.over) || 0) * 6;
  const remaining = Math.max(0, scheduledBalls - balls);
  const required = target === null ? 0 : Math.max(0, target - (Number(inningState.score) || 0));
  const late = !matchType.unlimitedBowling && remaining > 0 && remaining <= (Number(matchType.over) || 0) * 1.2;
  const underPressure = remaining > 0 && required * 6 / remaining >= 9;
  const approach = underPressure || late
    ? 'attack'
    : !matchType.unlimitedBowling && (Number(inningState.wickets) || 0) >= 7 ? 'defend' : 'balanced';
  return {
    approach,
    shot: approach === 'attack' ? ['loft', 'drive', 'cutPull', 'rotate'][balls % 4] : approach === 'defend' ? 'leave' : 'rotate',
    target: ['straight', 'cover', 'midWicket', 'point', 'squareLeg'][balls % 5],
  };
};

export const createRealismDelivery = ({
  inningState, matchType, matchTypeKey, isFirstInnings, firstInningsScore, isUserBatting,
  isUserBowling, battingTactics, bowlingTactics, striker, bowler, random = Math.random, targetScore,
}) => {
  const target = targetScore === undefined ? (isFirstInnings ? null : Number(firstInningsScore || 0) + 1) : targetScore;
  const fieldPreset = isUserBowling ? null : selectLegalOpponentField({
    inningState, matchType, matchTypeKey, target, battingHand: striker?.battingHand,
  });
  const batting = normalizeBattingTactics(isUserBatting
    ? battingTactics
    : selectComputerBattingPlan({ inningState, matchType, target }));
  const bowling = normalizeBowlingTactics(isUserBowling ? bowlingTactics : {
    fieldPreset,
    overPlan: fieldPreset === 'deathOvers' ? 'contain' : 'balanced',
    line: !matchType.unlimitedBowling && (inningState.balls || 0) % 3 === 0 ? 'outside' : 'stumps',
    length: fieldPreset === 'deathOvers' ? 'yorker' : 'good',
  });
  const pace = (bowler?.paceAbility ?? 0) >= (bowler?.spinAbility ?? 0);
  const battingAbility = pace ? striker?.abilityToPlayPaceBall ?? 50 : striker?.abilityToPlaySpinBall ?? 50;
  const bowlingAbility = pace ? bowler?.paceAbility ?? 40 : bowler?.spinAbility ?? 35;
  const actualBatting = { ...batting };
  const actualBowling = { ...bowling };
  if (random() > clamp(0.55 + battingAbility / 300, 0.55, 0.9)) {
    const index = sectors.indexOf(batting.target);
    const offset = random() < 0.5 ? -1 : 1;
    actualBatting.target = sectors[(index + offset + sectors.length) % sectors.length];
  }
  if (random() > clamp(0.55 + bowlingAbility / 300, 0.55, 0.9)) {
    actualBowling.length = bowling.length === 'yorker' ? 'full' : bowling.length === 'short' ? 'good' : 'short';
  }
  return {
    batting: actualBatting,
    bowling: actualBowling,
    intendedBatting: batting,
    intendedBowling: bowling,
    fieldPositions: [...getFieldPositions(bowling)],
  };
};

export const getContinuousAbilityShift = (difference) => {
  const factor = clamp(difference / 60, -1, 1);
  return { 0: -4 * factor, 1: 2 * factor, 2: 0.6 * factor, 4: 2 * factor, 6: 0.8 * factor, W: -1.2 * factor };
};
