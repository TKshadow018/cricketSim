import { fieldSettingList } from '../../../gameData/fieldSettingList';
import { normalizeBattingTactics } from './battingTactics';

const sectorPositions = {
  thirdMan: { inner: ['shortThirdMan', 'flySlip', 'gully'], deep: ['thirdMan', 'deepThirdMan'] },
  point: { inner: ['point', 'shortPoint', 'backwardPoint'], deep: ['deepPoint', 'deepBackwardPoint'] },
  cover: { inner: ['cover', 'extraCover'], deep: ['deepCover', 'deepExtraCover', 'sweeperCover'] },
  midOff: { inner: ['midOff', 'shortMidOff'], deep: ['longOff'] },
  straight: { inner: ['midOff', 'shortMidOff', 'midOn', 'shortMidOn'], deep: ['longOff', 'longOn'] },
  midOn: { inner: ['midOn', 'shortMidOn'], deep: ['longOn'] },
  midWicket: { inner: ['midWicket', 'shortMidWicket'], deep: ['deepMidWicket', 'cowCorner'] },
  squareLeg: {
    inner: ['squareLeg', 'forwardSquareLeg', 'backwardSquareLeg'],
    deep: ['deepSquareLeg', 'deepBackwardSquareLeg'],
  },
  fineLeg: { inner: ['shortFineLeg'], deep: ['fineLeg', 'deepFineLeg', 'longLeg'] },
};

export const selectOpponentField = ({ inningState = {}, matchType = {}, matchTypeKey, target = null }) => {
  const balls = Math.max(0, Number(inningState?.balls) || 0);
  const overs = Math.max(0, Number(matchType?.over) || 0);
  const remaining = Math.max(0, overs * 6 - balls);
  const wickets = Number(inningState?.wickets) || 0;
  const runsNeeded = target === null || target === undefined
    ? null
    : Number(target) - (Number(inningState?.score) || 0);
  const format = String(matchTypeKey || '').toLowerCase();
  const isTest = ['test', 'practicetestmicro', 'practicetestmini'].includes(format);

  if (runsNeeded === 1 && remaining <= 6) {
    return 'defendSingle';
  }
  if (isTest) {
    if (balls < 60) return 'newBall';
    return wickets >= 7 ? 'attacking' : 'balanced';
  }
  const powerplayOvers = {
    odi: 10,
    t20: 6,
    t10: 2,
    mini: Math.ceil(overs * 0.2),
    micro: Math.ceil(overs * 0.2),
  }[format] || 0;
  if (balls < Math.min(overs, powerplayOvers) * 6) return 'powerplay';
  if (runsNeeded > 0 && remaining > 0 && remaining <= 30 && runsNeeded * 6 / remaining >= 10) return 'deathOvers';
  if (overs > 0 && balls >= Math.floor(overs * 0.8) * 6) return 'deathOvers';
  return wickets >= 7 ? 'attacking' : 'middleOvers';
};

export const selectOpponentFieldForDelivery = ({ isFirstInnings, inningState, matchType, matchTypeKey, firstInningsScore }) =>
  selectOpponentField({
    inningState,
    matchType,
    matchTypeKey,
    target: isFirstInnings ? null : Number(firstInningsScore || 0) + 1,
  });

export const getFieldCoverage = (preset, target) => {
  const setting = fieldSettingList.find(({ key }) => key === preset);
  const sector = sectorPositions[normalizeBattingTactics({ target }).target];
  const positions = setting?.positions || [];
  return {
    inner: sector.inner.filter((key) => positions.includes(key)),
    deep: sector.deep.filter((key) => positions.includes(key)),
  };
};

export const getFieldingTacticShift = (preset, battingTactics) => {
  if (!fieldSettingList.some(({ key }) => key === preset)) return {};
  const tactics = normalizeBattingTactics(battingTactics);
  if (tactics.shot === 'leave') return {};
  const coverage = getFieldCoverage(preset, tactics.target);
  return {
    ...(coverage.inner.length ? { 1: -1 } : {}),
    ...(coverage.deep.length ? { 2: 1, 4: -2 } : {}),
    ...(coverage.deep.length && ['loft', 'cutPull'].includes(tactics.shot) ? { 6: -1, W: 1 } : {}),
  };
};
