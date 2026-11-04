import {
  buildSaveSummary,
  buildStadiumSelectionItems,
  formatConditionLabel,
  OUTFIELD_ICON_PATH,
  PITCH_ICON_PATH,
  setCommentatorName,
} from './preMatchStageUtils';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';

describe('pre-match stage helpers', () => {
  test('builds a capped list of stadium choices with stable visual metadata', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    const venues = Array.from({ length: 20 }, (_, index) => ({ name: `Venue ${index}` }));
    const items = buildStadiumSelectionItems(venues);
    expect(items).toHaveLength(18);
    expect(items[0]).toMatchObject({
      name: 'Venue 0',
      visualClassName: 'sim-choice-visual-stadium',
    });
    expect(items[0].renderVisual()).toEqual(
      expect.objectContaining({
        type: 'img',
        props: expect.objectContaining({
          src: '/asset/img/icon/stadium/stadium1.png',
          alt: 'stadium',
        }),
      })
    );
    expect(PITCH_ICON_PATH).toBe('/asset/img/icon/conditions/pitch-512.svg');
    expect(OUTFIELD_ICON_PATH).toBe('/asset/img/icon/conditions/outfield-512.svg');
    randomSpy.mockRestore();

    expect(buildStadiumSelectionItems()).toEqual([]);
    const boundaryRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(1);
    const fallbackItem = buildStadiumSelectionItems([{ name: 'Fallback Venue' }])[0];
    expect(fallbackItem.renderVisual().props.src).toBe('/asset/img/icon/stadium/stadium1.png');
    boundaryRandomSpy.mockRestore();
  });

  test('formats condition names and derives deterministic commentator names', () => {
    expect(formatConditionLabel('wetWithDew')).toBe('Wet With Dew');
    expect(formatConditionLabel('lush-green_field')).toBe('Lush Green Field');
    expect(formatConditionLabel()).toBe('');

    expect(setCommentatorName({ name: 'Voice', lang: 'en-IN', gender: 'female' })).toMatch(/^(Meera Joshi|Ananya Rao|Kavya Menon|Riya Sharma|Isha Nair|Pooja Singh)$/);
    expect(setCommentatorName({ name: 'Voice', lang: 'en-GB', gender: 'male' })).toMatch(/^(Oliver Grant|George Turner|Harry Walton|Arthur Blake|Noah Carter|Leo Hughes)$/);
    expect(setCommentatorName({ name: 'Voice (Canada)', gender: 'female' })).toMatch(/^(Olivia Martin|Chloe Bennett|Mila Adams|Emma Fraser|Ava Clarke|Claire Wilson)$/);
    expect(setCommentatorName({ name: 'Zira Voice' })).toMatch(/^(Casey Morgan|Riley Carter|Alexis Parker|Taylor Brooks|Morgan Hayes|Jamie Reed)$/);
    expect(setCommentatorName({ name: 'UnknownVoice' })).toMatch(/^(Jordan Brown|Alex Taylor|Sam Parker|Jamie Wilson|Chris Carter|Ryan Stone|Casey Morgan|Riley Carter|Alexis Parker|Taylor Brooks|Morgan Hayes|Jamie Reed)$/);
    expect(setCommentatorName('')).toMatch(/^[A-Z]/);
    expect(setCommentatorName({ name: 'David Voice', lang: 'en-GB' })).toMatch(/^(Oliver Grant|George Turner|Harry Walton|Arthur Blake|Noah Carter|Leo Hughes)$/);
    expect(setCommentatorName({ name: 'A' })).toMatch(/^(Casey Morgan|Riley Carter|Alexis Parker|Taylor Brooks|Morgan Hayes|Jamie Reed)$/);
    expect(setCommentatorName({ name: 'Unknown (Atlantis)' })).toMatch(/^(Jordan Brown|Alex Taylor|Sam Parker|Jamie Wilson|Chris Carter|Ryan Stone|Casey Morgan|Riley Carter|Alexis Parker|Taylor Brooks|Morgan Hayes|Jamie Reed)$/);
    expect(setCommentatorName()).toMatch(/^[A-Z]/);
    expect(setCommentatorName(null)).toMatch(/^[A-Z]/);
  });

  test('builds summaries for active innings, completed series, tournaments, and setup states', () => {
    const base = {
      gameState: {
        stage: matchStatusEnum.TeamOneBat,
        gameMode: 'quick',
        ownTeam: 'Falcons',
        opponentTeam: 'Ravens',
        firstBattingSide: 'own',
        firstInnings: { score: 72, wickets: 2, balls: 47 },
        secondInnings: { score: 0, wickets: 0, balls: 0 },
      },
    };
    expect(buildSaveSummary(base, matchStatusEnum)).toBe('Falcons: 72/2 (7.5)');
    expect(buildSaveSummary({
      gameState: { ...base.gameState, stage: matchStatusEnum.TeamTwoBat, firstBattingSide: 'opponent', secondInnings: { score: 55, wickets: 3, balls: 31 } },
    }, matchStatusEnum)).toBe('Falcons: 55/3 (5.1)');
    expect(buildSaveSummary({
      gameState: { ...base.gameState, stage: matchStatusEnum.MatchEnd, gameMode: 'series', seriesLength: 3, seriesCurrentMatch: 2, seriesResults: [
        { winnerTeam: 'Falcons' },
        { winnerTeam: 'Ravens' },
        { winnerTeam: 'Tie' },
      ] },
    }, matchStatusEnum)).toContain('3-match series • Falcons 1-1 Ravens • Match 2: Ravens: 0/0 (0.0)');
    expect(buildSaveSummary({
      gameState: { ...base.gameState, stage: matchStatusEnum.SeriesSummary, gameMode: 'series', seriesResults: [
        { winnerTeam: 'Falcons' },
        { winnerTeam: 'Falcons' },
      ] },
    }, matchStatusEnum)).toContain('Series completed • Final 2-0');
    expect(buildSaveSummary({
      gameState: {
        stage: matchStatusEnum.SeriesSummary,
        gameMode: 'series',
        seriesLength: 0,
        seriesCurrentMatch: 0,
        ownTeam: '',
        opponentTeam: '',
        seriesResults: [],
      },
    }, matchStatusEnum)).toContain('1-match series • Own 0-0 Opponent • Match 1: Series completed • Final 0-0');
    expect(buildSaveSummary({
      gameState: { ...base.gameState, stage: matchStatusEnum.TossTime, gameMode: 'tournament', tournamentOpponentTeams: ['Ravens', 'Hawks'], tournamentUserTeam: 'Falcons', tournamentMatches: [
        { isComplete: true },
        { isComplete: false },
      ] },
    }, matchStatusEnum)).toContain('3-team knockout • Falcons • Completed 1: Stage');
    expect(buildSaveSummary({
      gameState: {
        stage: matchStatusEnum.TeamOneBat,
        gameMode: 'tournament',
        tournamentOpponentTeams: null,
        tournamentUserTeam: '',
        tournamentMatches: null,
        ownTeam: 'Falcons',
        opponentTeam: 'Ravens',
        firstBattingSide: 'own',
      },
    }, matchStatusEnum)).toBe('1-team knockout • Falcons • Completed 0: Falcons: 0/0 (0.0)');
    expect(buildSaveSummary({
      gameState: {
        stage: matchStatusEnum.TeamOneBat,
        ownTeam: 'Falcons',
        opponentTeam: 'Ravens',
        firstBattingSide: 'opponent',
        firstInnings: {},
      },
    }, matchStatusEnum)).toBe('Ravens: 0/0 (0.0)');
    expect(buildSaveSummary({
      gameState: {
        stage: matchStatusEnum.MatchEnd,
        ownTeam: 'Falcons',
        opponentTeam: 'Ravens',
        firstBattingSide: 'own',
      },
    }, matchStatusEnum)).toBe('Ravens: 0/0 (0.0)');
    expect(buildSaveSummary({ gameState: { stage: undefined } }, matchStatusEnum)).toBe('Stage - setup in progress');
    expect(buildSaveSummary(null, matchStatusEnum)).toBe('Stage - setup in progress');
  });
});
