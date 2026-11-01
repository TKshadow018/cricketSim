import { fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';
import { isValidFieldPositions } from './bowlingField';
import { selectOpponentField } from './opponentField';

const positionByKey = new Map(fieldPositionList.map((position) => [position.key, position]));
const isLimitedOvers = (format) => ['micro', 'mini', 't10', 't20', 'odi'].includes(format);

export const isOutsideFieldCircle = (position) => {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    throw new Error('A valid field position is required.');
  }
  return ((position.x - 200) / 110) ** 2 + ((position.y - 110) / 60) ** 2 > 1;
};

const outsideLimit = ({ format, balls, matchType }) => {
  if (matchType?.isSuperOver) return 2;
  if (!isLimitedOvers(format)) return Infinity;
  if (format === 'odi') return balls < 60 ? 2 : balls < 240 ? 4 : 5;
  const powerplay = format === 't20' ? 36 : format === 't10' ? 12 : Math.ceil((matchType?.over || 1) * 0.2) * 6;
  return balls < powerplay ? 2 : 5;
};

export const getFieldViolations = ({ positions, matchTypeKey, matchType = {}, balls = 0, battingHand = 'right' }) => {
  if (!isValidFieldPositions(positions)) return ['Choose nine distinct fielding positions.'];
  const format = String(matchTypeKey || '').toLowerCase();
  const fielders = positions.slice(1).map((key) => positionByKey.get(key));
  const onLegSide = (position) => battingHand === 'left' ? position.x < 200 : position.x > 200;
  const deep = fielders.filter(isOutsideFieldCircle).length;
  const legSide = fielders.filter(onLegSide).length;
  const behind = fielders.filter((position) => onLegSide(position) && position.y > 138).length;
  const limit = outsideLimit({ format, balls: Math.max(0, Number(balls) || 0), matchType });
  const violations = [];
  if (deep > limit) violations.push(`At most ${limit} fielders may be outside the circle.`);
  if ((isLimitedOvers(format) || matchType.isSuperOver) && legSide > 5) {
    violations.push('At most 5 fielders may be on the leg side.');
  }
  if (behind > 2) violations.push('At most 2 fielders may be behind the popping crease on the leg side.');
  return violations;
};

export const selectLegalOpponentField = ({ inningState = {}, matchType = {}, matchTypeKey, target = null, battingHand }) => {
  const preferred = selectOpponentField({ inningState, matchType, matchTypeKey, target });
  const candidates = [preferred, 'ring', 'balanced', 'attacking', ...fieldSettingList.map(({ key }) => key)];
  const legal = candidates.find((key) => {
    const setting = fieldSettingList.find((entry) => entry.key === key);
    return setting && getFieldViolations({
      positions: setting.positions,
      matchTypeKey,
      matchType,
      balls: inningState.balls,
      battingHand,
    }).length === 0;
  });
  if (!legal) throw new Error('No legal field preset is available for this match situation.');
  return legal;
};
