import {
  buildAdminMatrix,
  buildBattingOrderPreview,
  buildComposition,
  normalizeSelectedXIPlayers,
} from './dashboardUtils';
import { battingAction, bowlingAction } from '../gameData/actionType';
import { matchStatusEnum } from '../gameData/matchStatusEnum';
import { getPlayersForNations } from '../gameData/playerListForNation';
import { DEFAULT_BATTING_TACTICS } from '../features/game/utils/battingTactics';

jest.mock('../gameData/playerListForNation', () => ({
  getPlayersForNations: jest.fn(),
}));

const makePlayer = (id, overrides = {}) => ({
  id,
  name: `Player ${id}`,
  abilityToPlayPaceBall: 60,
  abilityToPlaySpinBall: 60,
  paceAbility: 55,
  spinAbility: 40,
  battingOrderCoeff: 1,
  ...overrides,
});

const ownPlayers = Array.from({ length: 12 }, (_, index) => makePlayer(`own-${index}`));
const opponentPlayers = Array.from({ length: 12 }, (_, index) => makePlayer(`opponent-${index}`));

const makeGameState = (overrides = {}) => ({
  matchTypeKey: 't20',
  ownTeam: 'India',
  opponentTeam: 'Australia',
  ownPlayingXI: ownPlayers.slice(0, 11).map((player) => player.id),
  opponentPlayingXI: opponentPlayers.slice(0, 11).map((player) => player.id),
  ownCustomPlayers: [],
  opponentCustomPlayers: [],
  stage: matchStatusEnum.TeamOneBat,
  firstBattingSide: 'own',
  firstInnings: { strikerIndex: 0, currentBowlerIndex: 0, balls: 0, freeHitArmed: false },
  secondInnings: { strikerIndex: 0, currentBowlerIndex: 0, balls: 0, freeHitArmed: false },
  ownTeamRoles: {},
  opponentTeamRoles: {},
  battingIntent: battingAction.normal,
  bowlingIntent: bowlingAction.normal,
  locationCountry: 'England',
  matchCondition: { pitch: 'sporting', outfield: 'lushGreen', weather: 'sunny' },
  ...overrides,
});

beforeEach(() => {
  getPlayersForNations.mockReturnValue({ ownPlayers, opponentPlayers });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('normalizeSelectedXIPlayers', () => {
  test('keeps valid unique players in selection order and limits the XI to eleven', () => {
    const players = Array.from({ length: 12 }, (_, index) => makePlayer(index));
    const selectedIds = [...players.map(({ id }) => id), 'missing', 0];

    expect(normalizeSelectedXIPlayers(players, selectedIds)).toEqual(players.slice(0, 11));
  });

  test('returns an empty list for missing players or selections', () => {
    expect(normalizeSelectedXIPlayers(null, [1])).toEqual([]);
    expect(normalizeSelectedXIPlayers([makePlayer(1)], null)).toEqual([]);
  });
});

test('builds player-role counts, including wicketkeepers and unclassified players', () => {
  expect(buildComposition([
    makePlayer('wk', { isWicketKeeper: true }),
    makePlayer('pace', { paceAbility: 90, spinAbility: 20, abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40 }),
    makePlayer('spin', { paceAbility: 20, spinAbility: 90, abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40 }),
    makePlayer('bat', { paceAbility: 20, spinAbility: 20, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 }),
    makePlayer('allrounder', { paceAbility: 70, spinAbility: 40, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 }),
    makePlayer('spin-allrounder', { paceAbility: 40, spinAbility: 70, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 }),
    makePlayer('none', { paceAbility: 20, spinAbility: 20, abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40 }),
    null,
  ])).toEqual({
    batsman: 1,
    allrounder: 2,
    pacer: 1,
    spinner: 1,
    wicketkeeper: 1,
    none: 2,
  });
  expect(buildComposition(null).none).toBe(0);
});

test('sorts the batting preview by coefficient, batting ability, then name', () => {
  const players = [
    makePlayer('zed', { name: 'Zed', battingOrderCoeff: 3, abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 50 }),
    makePlayer('beta', { name: 'Beta', battingOrderCoeff: 3, abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 60 }),
    makePlayer('alpha', { name: 'Alpha', battingOrderCoeff: 3, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 }),
    makePlayer('gamma', { name: 'Gamma', battingOrderCoeff: 3, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 }),
    makePlayer('opener', { name: 'Opener', battingOrderCoeff: 5 }),
    makePlayer('last', { name: 'Last', battingOrderCoeff: 0 }),
    null,
  ];

  expect(buildBattingOrderPreview(players).map(({ rank, player, coeff }) => [rank, player?.name || 'Missing', coeff])).toEqual([
    [1, 'Opener', 5],
    [2, 'Beta', 3],
    [3, 'Alpha', 3],
    [4, 'Gamma', 3],
    [5, 'Zed', 3],
    [6, 'Last', 0],
    [7, 'Missing', 0],
  ]);
  expect(buildBattingOrderPreview()).toEqual([]);
  expect(buildBattingOrderPreview(null)).toEqual([]);
});

test('builds the first-innings admin matrix with conditions, roles, free hit, and death overs', () => {
  const striker = ownPlayers[0];
  const bowler = opponentPlayers[0];
  const matrix = buildAdminMatrix(makeGameState({
    firstInnings: { strikerIndex: 0, currentBowlerIndex: 0, balls: 114, freeHitArmed: true },
    ownTeamRoles: { captainId: striker.id, viceCaptainId: striker.id },
    opponentTeamRoles: { captainId: bowler.id, viceCaptainId: bowler.id },
    battingIntent: battingAction.superShot,
    bowlingIntent: bowlingAction.specialBowl,
    locationCountry: 'Australia',
    matchCondition: { pitch: 'unknown-pitch', outfield: 'wetWithDew', weather: 'stormy' },
  }));

  expect(matrix).toMatchObject({
    isOwnBatting: true,
    strikerName: striker.name,
    bowlerName: bowler.name,
    bowlingType: 'Pace',
    battingIntentLabel: 'Free Hit',
    bowlingIntentLabel: 'Special Ball',
    factors: {
      weather: 'stormy',
      pitch: 'unknown-pitch',
      outfield: 'wetWithDew',
      phase: 'Death Phase',
      oversLeft: 1,
    },
  });
  expect(matrix.factors.battingSupport).toBe(7);
  expect(matrix.rows).toHaveLength(9);
  expect(matrix.rows.find(({ key }) => key === 'W').value).toBe(0);
  expect(matrix.rows.reduce((total, { value }) => total + value, 0)).toBe(100);
});

test('includes active individual and team skill impacts in the admin matrix', () => {
  const baseline = buildAdminMatrix(makeGameState());
  const ownPlayersWithSkill = ownPlayers.map((player, index) =>
    index === 0 ? makePlayer(player.id, { skills: ['HardHitter'] }) : player
  );
  const opponentPlayersWithSkills = opponentPlayers.map((player, index) => {
    if (index === 0) {
      return makePlayer(player.id, { skills: ['YorkerKing'] });
    }
    if (index === 1) {
      return makePlayer(player.id, { skills: ['SafeHands'] });
    }
    return player;
  });
  getPlayersForNations.mockReturnValueOnce({
    ownPlayers: ownPlayersWithSkill,
    opponentPlayers: opponentPlayersWithSkills,
  });

  const matrix = buildAdminMatrix(makeGameState());

  expect(matrix.skillImpacts).toEqual(expect.arrayContaining([
    expect.objectContaining({
      skillName: 'HardHitter',
      holderName: 'Player own-0',
      scope: 'batting',
      deltas: expect.objectContaining({ '6': 3 }),
    }),
    expect.objectContaining({
      skillName: 'YorkerKing',
      holderName: 'Player opponent-0',
      scope: 'bowling',
      deltas: expect.objectContaining({ W: 2 }),
    }),
    expect.objectContaining({
      skillName: 'SafeHands',
      holderName: 'Player opponent-1',
      scope: 'fullTeamBowling',
      deltas: expect.objectContaining({ '0': 2 }),
    }),
  ]));
  expect(matrix.rows).not.toEqual(baseline.rows);
  const matrixSix = matrix.rows.find(({ key }) => key === '6');
  const baselineSix = baseline.rows.find(({ key }) => key === '6');
  expect(matrixSix.skillImpact).toBe(matrixSix.value - baselineSix.value);
  expect(matrixSix.skillImpact).not.toBe(0);
});

test('reflects live batting tactics in the existing admin matrix rows', () => {
  const balanced = buildAdminMatrix(makeGameState({
    battingTactics: DEFAULT_BATTING_TACTICS,
  }));
  const attacking = buildAdminMatrix(makeGameState({
    battingTactics: {
      ...DEFAULT_BATTING_TACTICS,
      approach: 'attack',
      shot: 'loft',
      target: 'leg',
    },
  }));
  const valueFor = (matrix, outcome) => matrix.rows.find((row) => row.key === outcome)?.value || 0;

  expect(attacking.rows.map(({ key }) => key)).toEqual(balanced.rows.map(({ key }) => key));
  expect(attacking.rows).toHaveLength(9);
  expect(attacking.rows.reduce((total, { value }) => total + value, 0)).toBe(100);
  expect(valueFor(attacking, 'W')).toBeGreaterThan(valueFor(balanced, 'W'));
  expect(valueFor(attacking, '6')).toBeGreaterThan(valueFor(balanced, '6'));
  expect(attacking.battingIntentLabel).toBe('Normal');
});

test('uses defaults for incomplete XIs and shifts outcomes for the second innings', () => {
  const matrix = buildAdminMatrix(makeGameState({
    matchTypeKey: 'test',
    ownPlayingXI: ['invalid'],
    opponentPlayingXI: [],
    ownCustomPlayers: [makePlayer('custom-own')],
    opponentCustomPlayers: [makePlayer('custom-opponent')],
    stage: matchStatusEnum.TeamTwoBat,
    firstBattingSide: 'own',
    secondInnings: { strikerIndex: 0, currentBowlerIndex: 0, balls: 6, freeHitArmed: false },
    ownTeamRoles: {},
    opponentTeamRoles: {},
    battingIntent: 999,
    bowlingIntent: bowlingAction.saveRun,
    locationCountry: 'India',
    matchCondition: { pitch: 'dusty', outfield: 'fastAndHard', weather: 'windy' },
  }));

  expect(matrix.isOwnBatting).toBe(false);
  expect(matrix.strikerPlayer).toBe(opponentPlayers[0]);
  expect(matrix.bowlerPlayer).toBe(ownPlayers[0]);
  expect(matrix.bowlingType).toBe('Pace');
  expect(matrix.battingIntentLabel).toBe('Normal');
  expect(matrix.bowlingIntentLabel).toBe('Save Run');
  expect(matrix.factors).toMatchObject({
    weather: 'windy',
    pitch: 'dusty',
    outfield: 'fastAndHard',
    boundaryScoring: 9,
    phase: 'Normal Phase',
    oversLeft: 89,
  });
  expect(matrix.rows.reduce((total, { value }) => total + value, 0)).toBe(100);
});

test.each([
  ['micro', 0, 'Normal Phase'],
  ['ODI', 294, 'Death Phase'],
  ['practiceTestMini', 0, 'Normal Phase'],
  ['unknown', 0, 'Normal Phase'],
])('handles match type %s and a boundary outfield', (matchTypeKey, balls, expectedPhase) => {
  const matrix = buildAdminMatrix(makeGameState({
    matchTypeKey,
    firstInnings: { strikerIndex: 40, currentBowlerIndex: 40, balls, freeHitArmed: false },
    matchCondition: { pitch: 'grassy', outfield: 'fastAndHard', weather: 'rainy' },
  }));

  expect(matrix.strikerName).toBe('-');
  expect(matrix.bowlerName).toBe('-');
  expect(matrix.factors.phase).toBe(expectedPhase);
  expect(matrix.factors.boundaryScoring).toBe(9);
});

test('covers the default weather and low-boundary path with an even ability matchup', () => {
  const playersWithEvenMatchup = {
    ownPlayers: ownPlayers.map((player, index) =>
      index === 0 ? makePlayer(player.id, { abilityToPlayPaceBall: 60 }) : player
    ),
    opponentPlayers: opponentPlayers.map((player, index) =>
      index === 0 ? makePlayer(player.id, { paceAbility: 60, spinAbility: 20 }) : player
    ),
  };
  getPlayersForNations.mockReturnValue(playersWithEvenMatchup);

  const matrix = buildAdminMatrix(makeGameState({
    matchCondition: { pitch: 'sporting', outfield: 'lushGreen', weather: 'sunny' },
  }));

  expect(matrix.abilityDifference).toBe(0);
  expect(matrix.factors.boundaryScoring).toBe(3);
  expect(matrix.rows.reduce((total, { value }) => total + value, 0)).toBe(100);
});

test('uses safe defaults when innings, conditions, and custom player lists are absent', () => {
  const matrix = buildAdminMatrix(makeGameState({
    firstInnings: null,
    ownCustomPlayers: null,
    opponentCustomPlayers: null,
    matchCondition: null,
    bowlingIntent: 999,
  }));

  expect(matrix).toMatchObject({
    strikerName: '-',
    bowlerName: '-',
    battingAbility: 0,
    bowlingAbility: 0,
    bowlingIntentLabel: 'Normal',
    factors: { weather: '-', pitch: '-', outfield: '-', boundaryScoring: 3 },
  });
});

test('uses fallback abilities and spin bowling when the selected attributes are zero', () => {
  getPlayersForNations.mockReturnValue({
    ownPlayers: ownPlayers.map((player, index) => index === 0
      ? makePlayer(player.id, { abilityToPlayPaceBall: 0, abilityToPlaySpinBall: 0 })
      : player),
    opponentPlayers: opponentPlayers.map((player, index) => index === 0
      ? makePlayer(player.id, { paceAbility: 0, spinAbility: 75 })
      : player),
  });

  const matrix = buildAdminMatrix(makeGameState());

  expect(matrix.bowlingType).toBe('Spin');
  expect(matrix.battingAbility).toBe(57);
  expect(matrix.bowlingAbility).toBe(81);
});

test.each([
  [battingAction.defence, 'Defend'],
  [battingAction.hitBig, 'Hit Big'],
  [battingAction.superShot, 'Super Shot'],
])('applies the batting intent shift for intent %s', (battingIntent, label) => {
  const matrix = buildAdminMatrix(makeGameState({ battingIntent }));
  expect(matrix.battingIntentLabel).toBe(label);
});

test.each([
  [bowlingAction.tryForWicket, 'Wicket Ball'],
  [bowlingAction.saveRun, 'Save Run'],
  [bowlingAction.specialBowl, 'Special Ball'],
])('applies the bowling intent shift for intent %s', (bowlingIntent, label) => {
  const matrix = buildAdminMatrix(makeGameState({
    stage: matchStatusEnum.TeamTwoBat,
    firstBattingSide: 'own',
    bowlingIntent,
  }));
  expect(matrix.bowlingIntentLabel).toBe(label);
});

test.each([
  [95, 20],
  [80, 50],
  [72, 65],
  [20, 90],
  [40, 70],
  [50, 65],
])('handles ability differences for batting %s and bowling %s', (battingAbility, bowlingAbility) => {
  getPlayersForNations.mockReturnValue({
    ownPlayers: ownPlayers.map((player, index) => index === 0
      ? makePlayer(player.id, { abilityToPlayPaceBall: battingAbility })
      : player),
    opponentPlayers: opponentPlayers.map((player, index) => index === 0
      ? makePlayer(player.id, { paceAbility: bowlingAbility, spinAbility: 20 })
      : player),
  });

  const matrix = buildAdminMatrix(makeGameState());

  expect(matrix.abilityDifference).toBe(battingAbility - bowlingAbility);
});
