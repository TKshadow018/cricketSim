import {
  areRoundFixturesValid,
  buildPlayingXI,
  buildRandomBattingOrderCoeff,
  buildRoundOneFixtures,
  buildScorecard,
  collectTeamStatsForInnings,
  ensurePlayerMeta,
  formatOvers,
  getBattingOrderCoeffRange,
  normalizePlayingXIIds,
  pickDefaultRoles,
  randomKey,
  resolveSeriesStanding,
  runMilestoneBonus,
  sanitizeRoles,
  selectAIPlayingXI,
  shuffleArray,
  sortPlayersByBattingOrder,
  wicketMilestoneBonus,
} from './controllerCommonUtils';

const makePlayer = (id, playerType, offset = 0) => ({
  id,
  name: `Player ${id}`,
  playerType,
  abilityToPlayPaceBall: 65 + offset,
  abilityToPlaySpinBall: 65 + offset,
  paceAbility: playerType === 'bowler' ? 60 + offset : 10,
  spinAbility: playerType === 'spinner' ? 60 + offset : 10,
});

describe('tournament fixtures and team selection', () => {
  test('builds fixtures from valid teams and rejects malformed pairings', () => {
    expect(buildRoundOneFixtures()).toEqual([]);
    expect(areRoundFixturesValid()).toBe(false);
    expect(buildRoundOneFixtures(['A', '', 'B', 'C', 'D'], '2025-01-01')).toEqual([
      {
        id: 'R1-M1',
        round: 1,
        matchNumber: 1,
        teamA: 'A',
        teamB: 'B',
        date: '2025-01-01',
        winnerTeam: '',
        summary: '',
        isComplete: false,
      },
      {
        id: 'R1-M2',
        round: 1,
        matchNumber: 2,
        teamA: 'C',
        teamB: 'D',
        date: '2025-01-02',
        winnerTeam: '',
        summary: '',
        isComplete: false,
      },
    ]);
    expect(areRoundFixturesValid([], ['A', 'B'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: 'B' }], ['A', 'B', 'C'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: '' }], ['A', 'B'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: 'A' }], ['A', 'B'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: 'B' }], ['A', 'B'])).toBe(true);
  });

  test('normalizes selected players and assigns valid default or sanitized roles', () => {
    const players = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `Player ${index + 1}`,
      battingOrderCoeff: 100 - index,
      isWicketKeeper: index === 2,
    }));
    expect(normalizePlayingXIIds(players, [1, 1, 99, ...players.map(({ id }) => id)])).toHaveLength(11);
    expect(normalizePlayingXIIds(players, null)).toEqual([]);
    expect(sanitizeRoles({ captainId: 1, viceCaptainId: 99 }, [1, 2])).toEqual({
      captainId: 1,
      viceCaptainId: null,
      wicketKeeperId: null,
    });
    expect(sanitizeRoles(null, [])).toEqual({ captainId: null, viceCaptainId: null, wicketKeeperId: null });
    expect(sanitizeRoles({ captainId: 1, viceCaptainId: 2, wicketKeeperId: 3 }, [1, 2, 3])).toEqual({
      captainId: 1,
      viceCaptainId: 2,
      wicketKeeperId: 3,
    });
    expect(sanitizeRoles(undefined, [1])).toEqual({ captainId: null, viceCaptainId: null, wicketKeeperId: null });
    expect(pickDefaultRoles(players, [1, 2, 3])).toEqual({
      captainId: 1,
      viceCaptainId: 2,
      wicketKeeperId: 3,
    });
    expect(pickDefaultRoles(players, [1])).toEqual({
      captainId: 1,
      viceCaptainId: 1,
      wicketKeeperId: 1,
    });
    expect(pickDefaultRoles(players, [])).toEqual({
      captainId: null,
      viceCaptainId: null,
      wicketKeeperId: null,
    });
    expect(pickDefaultRoles()).toEqual({ captainId: null, viceCaptainId: null, wicketKeeperId: null });
    expect(buildPlayingXI(players, players.slice(0, 11).map(({ id }) => id))).toHaveLength(11);
    expect(buildPlayingXI(players, [999])).toHaveLength(11);
  });
});
