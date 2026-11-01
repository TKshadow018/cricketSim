import { fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';

const positionKeys = new Set(
  fieldPositionList.map(({ key }) => key).filter((key) => key !== 'bowler')
);

export const isValidFieldPositions = (positions) =>
  Array.isArray(positions) &&
  positions.length === 10 &&
  positions[0] === 'wicketkeeper' &&
  new Set(positions).size === 10 &&
  positions.every((key) => positionKeys.has(key));

export const getFieldPositions = (tactics) => {
  if (tactics?.fieldPreset === 'custom' && isValidFieldPositions(tactics.fieldPositions)) {
    return tactics.fieldPositions;
  }
  const setting = fieldSettingList.find(({ key }) => key === tactics?.fieldPreset) || fieldSettingList[0];
  return setting.positions;
};

export const getClosestFieldPreset = (positions) =>
  fieldSettingList.reduce((closest, setting) => {
    const matches = setting.positions.filter((position) => positions.includes(position)).length;
    return matches > closest.matches ? { key: setting.key, matches } : closest;
  }, { key: fieldSettingList[0].key, matches: -1 }).key;
