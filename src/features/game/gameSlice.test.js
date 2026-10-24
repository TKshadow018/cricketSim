import reducer, {
  buildEmptyMatchCondition,
  buildInitialInnings,
  buildRandomMatchCondition,
  hydrateGameState,
  resetMatchForCareer,
  resetMatchRuntime,
  setBattingIntent,
  setBowlingIntent,
  setCareerAuctionSummary,
  setCareerDomesticCountry,
  setCareerDomesticTeams,
  setCareerFormat,
  setCareerGlobalPlayerPool,
  setCareerMatchIndex,
  setCareerOffers,
  setCareerPlayerProfile,
  setCareerPlayerStats,
  setCareerRetired,
  setCareerSchedule,
  setCareerSeason,
  setCareerSeasonHistory,
  setCareerSeasonLength,
  setCareerStandings,
  setCareerTeam,
  setCommentator,
  setFirstBattingSide,
  setFirstInnings,
  setGameMode,
  setLocationCountry,
  setMatchCondition,
  setMatchTypeKey,
  setOpponentCustomPlayers,
  setOpponentPlayingXI,
  setOpponentTeam,
  setOpponentTeamRoles,
  setOwnCustomPlayers,
  setOwnPlayingXI,
  setOwnTeam,
  setOwnTeamRoles,
  setSecondInnings,
  setSelectedStadium,
  setSeriesCurrentMatch,
  setSeriesLength,
  setSeriesPlayerStats,
  setSeriesResults,
  setShowScoreboard,
  setStage,
  setTossCall,
  setTossDecision,
  setTossWinner,
  setTournamentChampion,
  setTournamentCurrentMatchId,
  setTournamentMatches,
  setTournamentOpponentTeams,
  setTournamentPlayerStats,
  setTournamentUserTeam,
  toggleShowScoreboard,
} from './gameSlice';
import { battingAction, bowlingAction } from '../../gameData/actionType';
import { matchStatusEnum } from '../../gameData/matchStatusEnum';

describe('game state setup', () => {
  test('builds clean innings and conditions', () => {
    expect(buildInitialInnings()).toMatchObject({
      score: 0,
      wickets: 0,
      balls: 0,
      strikerIndex: null,
      nonStrikerIndex: null,
      currentBowlerIndex: null,
      battingStats: [],
      bowlingStats: [],
      lastEvent: 'Ready for first delivery.',
    });
    expect(buildEmptyMatchCondition()).toEqual({ weather: '', pitch: '', outfield: '' });

    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    const condition = buildRandomMatchCondition();
    random.mockRestore();
    expect(condition.weather).toBe('sunny');
    expect(condition.pitch).toBe('grassy');
    expect(condition.outfield).toBe('lushGreen');
  });

  test('starts with the quick-match defaults', () => {
    expect(reducer(undefined, { type: 'unknown' })).toMatchObject({
      stage: matchStatusEnum.intro,
      gameMode: 'quick',
      seriesLength: 1,
      seriesCurrentMatch: 1,
      ownTeam: '',
      opponentTeam: '',
      battingIntent: battingAction.normal,
      bowlingIntent: bowlingAction.normal,
      matchCondition: buildEmptyMatchCondition(),
      firstInnings: buildInitialInnings(),
      secondInnings: buildInitialInnings(),
      showScoreboard: false,
    });
  });

  test('sets each match, competition, team, and career field', () => {
    const cases = [
      [setStage, 'stage', 4],
      [setGameMode, 'gameMode', 'career'],
      [setSeriesLength, 'seriesLength', 3],
      [setSeriesCurrentMatch, 'seriesCurrentMatch', 2],
      [setSeriesResults, 'seriesResults', ['win']],
      [setSeriesPlayerStats, 'seriesPlayerStats', { player: 1 }],
      [setTournamentUserTeam, 'tournamentUserTeam', 'India'],
      [setTournamentOpponentTeams, 'tournamentOpponentTeams', ['A', 'B']],
      [setTournamentMatches, 'tournamentMatches', [{ id: 'm1' }]],
      [setTournamentCurrentMatchId, 'tournamentCurrentMatchId', 'm1'],
      [setTournamentChampion, 'tournamentChampion', 'India'],
      [setTournamentPlayerStats, 'tournamentPlayerStats', { player: 2 }],
      [setCareerTeam, 'careerTeam', 'Team A'],
      [setCareerPlayerProfile, 'careerPlayerProfile', { playerId: 'p1' }],
      [setCareerDomesticCountry, 'careerDomesticCountry', 'Australia'],
      [setCareerDomesticTeams, 'careerDomesticTeams', [{ name: 'A' }]],
      [setCareerGlobalPlayerPool, 'careerGlobalPlayerPool', [{ id: 'p1' }]],
      [setCareerAuctionSummary, 'careerAuctionSummary', { signed: true }],
      [setCareerOffers, 'careerOffers', [{ team: 'A' }]],
      [setCareerRetired, 'careerRetired', true],
      [setCareerSeason, 'careerSeason', 4],
      [setCareerSeasonLength, 'careerSeasonLength', 'full'],
      [setCareerFormat, 'careerFormat', 'odi'],
      [setCareerMatchIndex, 'careerMatchIndex', 8],
      [setCareerSchedule, 'careerSchedule', [{ id: 'm2' }]],
      [setCareerStandings, 'careerStandings', { Team: { points: 3 } }],
      [setCareerPlayerStats, 'careerPlayerStats', { player: { runs: 10 } }],
      [setCareerSeasonHistory, 'careerSeasonHistory', [{ season: 1 }]],
      [setMatchTypeKey, 'matchTypeKey', 't20'],
      [setLocationCountry, 'locationCountry', 'India'],
      [setSelectedStadium, 'selectedStadium', 'Ground'],
      [setCommentator, 'commentator', 'Voice'],
      [setTossWinner, 'tossWinner', 'India'],
      [setTossDecision, 'tossDecision', 'bat'],
      [setTossCall, 'tossCall', 'heads'],
      [setFirstBattingSide, 'firstBattingSide', 'India'],
      [setMatchCondition, 'matchCondition', { weather: 'sunny' }],
      [setBattingIntent, 'battingIntent', battingAction.hitBig],
      [setBowlingIntent, 'bowlingIntent', bowlingAction.tryForWicket],
      [setFirstInnings, 'firstInnings', { score: 12 }],
      [setSecondInnings, 'secondInnings', { score: 8 }],
      [setShowScoreboard, 'showScoreboard', true],
      [setOwnPlayingXI, 'ownPlayingXI', ['p1']],
      [setOpponentPlayingXI, 'opponentPlayingXI', ['p2']],
      [setOwnCustomPlayers, 'ownCustomPlayers', ['custom-1']],
      [setOpponentCustomPlayers, 'opponentCustomPlayers', ['custom-2']],
      [setOwnTeamRoles, 'ownTeamRoles', { captainId: 'c1', viceCaptainId: 'v1', wicketKeeperId: 'w1' }],
      [setOpponentTeamRoles, 'opponentTeamRoles', { captainId: 'c2', viceCaptainId: 'v2', wicketKeeperId: 'w2' }],
    ];

    cases.forEach(([action, field, value]) => {
      expect(reducer(undefined, action(value))[field]).toEqual(value);
    });
  });

  test('normalizes invalid action payloads and resets dependent team selections', () => {
    const invalids = [
      [setSeriesLength, 'seriesLength', 0, 1],
      [setSeriesLength, 'seriesLength', 'bad', 1],
      [setSeriesCurrentMatch, 'seriesCurrentMatch', -1, 1],
      [setSeriesCurrentMatch, 'seriesCurrentMatch', 'invalid', 1],
      [setSeriesResults, 'seriesResults', {}, []],
      [setSeriesPlayerStats, 'seriesPlayerStats', null, {}],
      [setTournamentOpponentTeams, 'tournamentOpponentTeams', 'teams', []],
      [setTournamentMatches, 'tournamentMatches', null, []],
      [setTournamentPlayerStats, 'tournamentPlayerStats', [], []],
      [setTournamentPlayerStats, 'tournamentPlayerStats', null, {}],
      [setCareerPlayerProfile, 'careerPlayerProfile', [], []],
      [setCareerPlayerProfile, 'careerPlayerProfile', null, null],
      [setCareerAuctionSummary, 'careerAuctionSummary', null, null],
      [setCareerOffers, 'careerOffers', null, []],
      [setCareerSeason, 'careerSeason', 'bad', 0],
      [setCareerMatchIndex, 'careerMatchIndex', 'bad', 0],
      [setCareerStandings, 'careerStandings', null, {}],
      [setCareerPlayerStats, 'careerPlayerStats', null, {}],
      [setCareerDomesticTeams, 'careerDomesticTeams', null, []],
      [setCareerGlobalPlayerPool, 'careerGlobalPlayerPool', null, []],
      [setCareerSchedule, 'careerSchedule', null, []],
      [setCareerSeasonHistory, 'careerSeasonHistory', null, []],
      [setOwnPlayingXI, 'ownPlayingXI', {}, []],
      [setOpponentPlayingXI, 'opponentPlayingXI', {}, []],
      [setOwnCustomPlayers, 'ownCustomPlayers', {}, []],
      [setOpponentCustomPlayers, 'opponentCustomPlayers', {}, []],
      [setOwnTeamRoles, 'ownTeamRoles', { captainId: 'c1' }, { captainId: 'c1', viceCaptainId: null, wicketKeeperId: null }],
      [setOwnTeamRoles, 'ownTeamRoles', null, { captainId: null, viceCaptainId: null, wicketKeeperId: null }],
      [setOwnTeamRoles, 'ownTeamRoles', { captainId: null, viceCaptainId: 'v1', wicketKeeperId: 'w1' }, { captainId: null, viceCaptainId: 'v1', wicketKeeperId: 'w1' }],
      [setOpponentTeamRoles, 'opponentTeamRoles', null, { captainId: null, viceCaptainId: null, wicketKeeperId: null }],
      [setCareerRetired, 'careerRetired', 0, false],
      [setCareerSeasonLength, 'careerSeasonLength', '', 'standard'],
      [setCareerFormat, 'careerFormat', '', 't20'],
      [setCareerDomesticCountry, 'careerDomesticCountry', null, ''],
      [setCareerTeam, 'careerTeam', null, ''],
      [setTournamentUserTeam, 'tournamentUserTeam', null, ''],
      [setTournamentCurrentMatchId, 'tournamentCurrentMatchId', null, ''],
      [setTournamentChampion, 'tournamentChampion', null, ''],
    ];
    invalids.forEach(([action, field, value, expected]) => {
      expect(reducer(undefined, action(value))[field]).toEqual(expected);
    });

    const beforeOwnTeamChange = reducer(undefined, setOwnPlayingXI(['p1']));
    const ownTeamChanged = reducer(beforeOwnTeamChange, setOwnTeam('India'));
    expect(ownTeamChanged).toMatchObject({
      ownTeam: 'India',
      ownPlayingXI: [],
      ownCustomPlayers: [],
      ownTeamRoles: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    });

    const beforeOpponentTeamChange = reducer(undefined, setOpponentPlayingXI(['p2']));
    expect(reducer(beforeOpponentTeamChange, setOpponentTeam('Australia'))).toMatchObject({
      opponentTeam: 'Australia',
      opponentPlayingXI: [],
      opponentCustomPlayers: [],
      opponentTeamRoles: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    });
    expect(reducer(undefined, toggleShowScoreboard()).showScoreboard).toBe(true);
    expect(reducer(reducer(undefined, toggleShowScoreboard()), toggleShowScoreboard()).showScoreboard).toBe(false);
  });

  test('hydrates modern and legacy saves while retaining safe defaults for invalid fields', () => {
    const legacy = reducer(undefined, hydrateGameState({ stage: 9 }));
    expect(legacy.stage).toBe(11);
    expect(reducer(undefined, hydrateGameState()).stage).toBe(matchStatusEnum.intro);

    const currentStage = reducer(
      undefined,
      hydrateGameState({ stage: 9, ownPlayingXI: [], opponentPlayingXI: [] })
    );
    expect(currentStage.stage).toBe(9);

    const populated = reducer(
      undefined,
      hydrateGameState({
        stage: 12,
        gameMode: 'career',
        seriesLength: 4,
        seriesCurrentMatch: 3,
        seriesResults: ['win'],
        seriesPlayerStats: { p1: {} },
        tournamentUserTeam: 'India',
        tournamentOpponentTeams: ['A'],
        tournamentMatches: [{ id: 'm1' }],
        tournamentCurrentMatchId: 'm1',
        tournamentChampion: 'India',
        tournamentPlayerStats: { p1: {} },
        careerTeam: 'Team A',
        careerPlayerProfile: { playerId: 'p1' },
        careerDomesticCountry: 'India',
        careerDomesticTeams: [{ name: 'Team A' }],
        careerGlobalPlayerPool: [{ id: 'p1' }],
        careerAuctionSummary: { signed: true },
        careerOffers: [{ team: 'Team A' }],
        careerRetired: true,
        careerSeason: 0,
        careerSeasonLength: 'short',
        careerFormat: 'odi',
        careerMatchIndex: 0,
        careerSchedule: [{ id: 'fixture' }],
        careerStandings: { Team: {} },
        careerPlayerStats: { p1: {} },
        careerSeasonHistory: [{ season: 1 }],
        ownPlayingXI: ['p1'],
        opponentPlayingXI: ['p2'],
        ownCustomPlayers: ['custom-1'],
        opponentCustomPlayers: ['custom-2'],
        ownTeamRoles: { captainId: 'p1' },
        opponentTeamRoles: { captainId: 'p2' },
        firstInnings: { score: 10 },
        secondInnings: { score: 4 },
      })
    );
    expect(populated).toMatchObject({
      stage: 12,
      gameMode: 'career',
      seriesLength: 4,
      seriesCurrentMatch: 3,
      tournamentChampion: 'India',
      careerTeam: 'Team A',
      careerRetired: true,
      ownPlayingXI: ['p1'],
      opponentPlayingXI: ['p2'],
      firstInnings: { score: 10, wickets: 0, lastEvent: 'Ready for first delivery.' },
      secondInnings: { score: 4, wickets: 0 },
    });

    const invalid = reducer(
      populated,
      hydrateGameState({
        stage: undefined,
        gameMode: '',
        seriesLength: 0,
        seriesCurrentMatch: 0,
        seriesResults: null,
        seriesPlayerStats: null,
        tournamentUserTeam: '',
        tournamentOpponentTeams: null,
        tournamentMatches: null,
        tournamentCurrentMatchId: '',
        tournamentChampion: '',
        tournamentPlayerStats: null,
        careerTeam: '',
        careerPlayerProfile: null,
        careerDomesticCountry: '',
        careerDomesticTeams: null,
        careerGlobalPlayerPool: null,
        careerAuctionSummary: null,
        careerOffers: null,
        careerRetired: 'no',
        careerSeason: -1,
        careerSeasonLength: '',
        careerFormat: '',
        careerMatchIndex: -1,
        careerSchedule: null,
        careerStandings: null,
        careerPlayerStats: null,
        careerSeasonHistory: null,
        ownPlayingXI: null,
        opponentPlayingXI: null,
        ownCustomPlayers: null,
        opponentCustomPlayers: null,
        ownTeamRoles: null,
        opponentTeamRoles: null,
      })
    );
    expect(invalid).toMatchObject({
      stage: 12,
      gameMode: 'career',
      seriesLength: 4,
      seriesCurrentMatch: 3,
      tournamentChampion: 'India',
      careerTeam: 'Team A',
      careerRetired: true,
      careerSeason: 0,
      careerMatchIndex: 0,
      ownPlayingXI: ['p1'],
      opponentPlayingXI: ['p2'],
    });
  });

  test('resets match state completely and prepares the next career fixture', () => {
    const filled = reducer(
      undefined,
      hydrateGameState({
        gameMode: 'career',
        seriesLength: 4,
        stage: 12,
        ownTeam: 'India',
        opponentTeam: 'Australia',
        careerTeam: 'Team A',
        careerSeason: 2,
        careerSchedule: [{ id: 'fixture' }],
        ownPlayingXI: ['p1'],
        opponentPlayingXI: ['p2'],
        showScoreboard: true,
      })
    );

    const reset = reducer(filled, resetMatchRuntime());
    expect(reset).toMatchObject({
      stage: matchStatusEnum.intro,
      gameMode: 'quick',
      seriesLength: 1,
      ownTeam: '',
      opponentTeam: '',
      careerTeam: '',
      careerSeason: 0,
      careerSchedule: [],
      ownPlayingXI: [],
      opponentPlayingXI: [],
      showScoreboard: false,
      matchCondition: buildEmptyMatchCondition(),
      firstInnings: buildInitialInnings(),
      secondInnings: buildInitialInnings(),
    });

    const careerReady = reducer(filled, resetMatchForCareer());
    expect(careerReady).toMatchObject({
      gameMode: 'career',
      careerTeam: 'Team A',
      ownTeam: 'Team A',
      opponentTeam: '',
      careerSeason: 2,
      careerSchedule: [{ id: 'fixture' }],
      ownPlayingXI: [],
      opponentPlayingXI: [],
      showScoreboard: false,
      matchCondition: buildEmptyMatchCondition(),
    });
  });
});
