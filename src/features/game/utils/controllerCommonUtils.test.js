import {
  buildScorecard,
  randomKey,
  runMilestoneBonus,
  wicketMilestoneBonus,
  formatOvers,
  collectTeamStatsForInnings,
  resolveSeriesStanding,
  shuffleArray,
  buildRoundOneFixtures,
  areRoundFixturesValid,
  normalizePlayingXIIds,
  sanitizeRoles,
  pickDefaultRoles,
  buildPlayingXI,
} from './controllerCommonUtils';

describe('buildScorecard', () => {
  it('constructs a scorecard object with expected shape', () => {
    const inningsState = { score: 120, wickets: 5 };
    const inningsView = { battingRows: [], bowlingRows: [] };
    const card = buildScorecard('1st Innings', inningsState, inningsView, '20.0');
    expect(card.title).toBe('1st Innings');
    expect(card.line).toBe('1st Innings 120/5');
    expect(card.overs).toBe('20.0');
    expect(Array.isArray(card.battingRows)).toBe(true);
    expect(Array.isArray(card.bowlingRows)).toBe(true);
  });
});

describe('randomKey', () => {
  it('returns one of the map keys', () => {
    const map = { a: 1, b: 2, c: 3 };
    expect(Object.keys(map)).toContain(randomKey(map));
  });

  it('returns empty string for an empty or null map', () => {
    expect(randomKey({})).toBe('');
    expect(randomKey(null)).toBe('');
    expect(randomKey(undefined)).toBe('');
  });
});

describe('runMilestoneBonus', () => {
  it('returns 20 for 200+ runs', () => {
    expect(runMilestoneBonus(200)).toBe(20);
    expect(runMilestoneBonus(250)).toBe(20);
  });

  it('returns 10 for 150-199 runs', () => {
    expect(runMilestoneBonus(150)).toBe(10);
    expect(runMilestoneBonus(199)).toBe(10);
  });

  it('returns 5 for 100-149 runs', () => {
    expect(runMilestoneBonus(100)).toBe(5);
    expect(runMilestoneBonus(149)).toBe(5);
  });

  it('returns 2 for 50-99 runs', () => {
    expect(runMilestoneBonus(50)).toBe(2);
    expect(runMilestoneBonus(99)).toBe(2);
  });

  it('returns 1 for 30-49 runs', () => {
    expect(runMilestoneBonus(30)).toBe(1);
    expect(runMilestoneBonus(49)).toBe(1);
  });

  it('returns 0 for fewer than 30 runs', () => {
    expect(runMilestoneBonus(0)).toBe(0);
    expect(runMilestoneBonus(29)).toBe(0);
  });
});

describe('wicketMilestoneBonus', () => {
  it('returns 20 for 8+ wickets', () => {
    expect(wicketMilestoneBonus(8)).toBe(20);
    expect(wicketMilestoneBonus(10)).toBe(20);
  });

  it('returns 10 for 6-7 wickets', () => {
    expect(wicketMilestoneBonus(6)).toBe(10);
    expect(wicketMilestoneBonus(7)).toBe(10);
  });

  it('returns 5 for 5 wickets', () => {
    expect(wicketMilestoneBonus(5)).toBe(5);
  });

  it('returns 2 for 4 wickets', () => {
    expect(wicketMilestoneBonus(4)).toBe(2);
  });

  it('returns 1 for 3 wickets', () => {
    expect(wicketMilestoneBonus(3)).toBe(1);
  });

  it('returns 0 for fewer than 3 wickets', () => {
    expect(wicketMilestoneBonus(0)).toBe(0);
    expect(wicketMilestoneBonus(2)).toBe(0);
  });
});

describe('formatOvers', () => {
  it('returns "0.0" for 0 balls', () => {
    expect(formatOvers(0)).toBe('0.0');
  });

  it('returns "1.0" for 6 balls', () => {
    expect(formatOvers(6)).toBe('1.0');
  });

  it('returns "2.4" for 16 balls', () => {
    expect(formatOvers(16)).toBe('2.4');
  });

  it('defaults balls to 0 when not provided', () => {
    expect(formatOvers()).toBe('0.0');
  });
});

describe('collectTeamStatsForInnings', () => {
  const players = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  it('accumulates batting stats into targetMap', () => {
    const targetMap = {};
    collectTeamStatsForInnings({
      teamName: 'India',
      players,
      battingStats: [{ runs: 50, balls: 40, isOut: true }, { runs: 20, balls: 25, isOut: false }],
      bowlingStats: [],
      targetMap,
    });
    expect(targetMap['India::p1::Alice'].runs).toBe(50);
    expect(targetMap['India::p1::Alice'].outs).toBe(1);
    expect(targetMap['India::p2::Bob'].runs).toBe(20);
    expect(targetMap['India::p2::Bob'].outs).toBe(0);
  });

  it('accumulates bowling stats into targetMap', () => {
    const targetMap = {};
    collectTeamStatsForInnings({
      teamName: 'Aus',
      players,
      battingStats: [],
      bowlingStats: [{ wickets: 2, balls: 18, runsConceded: 30 }, { wickets: 1, balls: 12, runsConceded: 15 }],
      targetMap,
    });
    expect(targetMap['Aus::p1::Alice'].wickets).toBe(2);
    expect(targetMap['Aus::p2::Bob'].ballsBowled).toBe(12);
  });

  it('merges into existing targetMap entries', () => {
    const targetMap = {
      'India::p1::Alice': { key: 'India::p1::Alice', team: 'India', name: 'Alice', runs: 30, outs: 0, wickets: 0, balls: 20, ballsBowled: 0, runsConceded: 0, matches: 1 },
    };
    collectTeamStatsForInnings({
      teamName: 'India',
      players: [{ id: 'p1', name: 'Alice' }],
      battingStats: [{ runs: 25, balls: 20, isOut: true }],
      bowlingStats: [],
      targetMap,
    });
    expect(targetMap['India::p1::Alice'].runs).toBe(55);
    expect(targetMap['India::p1::Alice'].outs).toBe(1);
  });

  it('skips null players', () => {
    const targetMap = {};
    collectTeamStatsForInnings({
      teamName: 'India',
      players: [null, { id: 'p1', name: 'Alice' }],
      battingStats: [{}, { runs: 10, balls: 8, isOut: false }],
      bowlingStats: [],
      targetMap,
    });
    expect(Object.keys(targetMap)).toHaveLength(1);
  });
});

describe('resolveSeriesStanding', () => {
  const results = [
    { winnerTeam: 'India' },
    { winnerTeam: 'Australia' },
    { winnerTeam: 'India' },
    { winnerTeam: '' },
  ];

  it('counts wins for own team', () => {
    const { ownWins } = resolveSeriesStanding(results, 'India', 'Australia');
    expect(ownWins).toBe(2);
  });

  it('counts wins for opponent team', () => {
    const { opponentWins } = resolveSeriesStanding(results, 'India', 'Australia');
    expect(opponentWins).toBe(1);
  });

  it('counts ties', () => {
    const { ties } = resolveSeriesStanding(results, 'India', 'Australia');
    expect(ties).toBe(1);
  });

  it('returns zeros for empty results', () => {
    expect(resolveSeriesStanding([], 'A', 'B')).toEqual({ ownWins: 0, opponentWins: 0, ties: 0 });
  });
});

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    shuffleArray(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('contains the same elements', () => {
    const arr = [1, 2, 3, 4];
    expect(shuffleArray(arr).sort()).toEqual([1, 2, 3, 4]);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });
});

describe('buildRoundOneFixtures', () => {
  it('creates correct number of fixture pairs', () => {
    const teams = ['A', 'B', 'C', 'D'];
    const fixtures = buildRoundOneFixtures(teams);
    expect(fixtures).toHaveLength(2);
  });

  it('each fixture has correct shape', () => {
    const [fixture] = buildRoundOneFixtures(['X', 'Y'], '2024-01-01');
    expect(fixture).toMatchObject({
      id: 'R1-M1',
      round: 1,
      matchNumber: 1,
      teamA: 'X',
      teamB: 'Y',
      isComplete: false,
    });
  });

  it('ignores falsy team entries', () => {
    const fixtures = buildRoundOneFixtures(['A', null, 'B', 'C']);
    // after filtering: ['A', 'B', 'C'] → 1 pair
    expect(fixtures).toHaveLength(1);
  });

  it('returns empty array for no teams', () => {
    expect(buildRoundOneFixtures([])).toEqual([]);
  });
});

describe('areRoundFixturesValid', () => {
  it('returns true for valid fixtures matching all expected teams', () => {
    const fixtures = [
      { teamA: 'A', teamB: 'B' },
      { teamA: 'C', teamB: 'D' },
    ];
    expect(areRoundFixturesValid(fixtures, ['A', 'B', 'C', 'D'])).toBe(true);
  });

  it('returns false when a team appears twice', () => {
    const fixtures = [
      { teamA: 'A', teamB: 'A' },
      { teamA: 'C', teamB: 'D' },
    ];
    expect(areRoundFixturesValid(fixtures, ['A', 'A', 'C', 'D'])).toBe(false);
  });

  it('returns false for empty fixtures', () => {
    expect(areRoundFixturesValid([], ['A', 'B'])).toBe(false);
  });

  it('returns false when fixture count does not match teams', () => {
    const fixtures = [{ teamA: 'A', teamB: 'B' }];
    expect(areRoundFixturesValid(fixtures, ['A', 'B', 'C', 'D'])).toBe(false);
  });
});

describe('normalizePlayingXIIds', () => {
  const allPlayers = [
    { id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' },
    { id: 'p6' }, { id: 'p7' }, { id: 'p8' }, { id: 'p9' }, { id: 'p10' },
    { id: 'p11' }, { id: 'p12' },
  ];

  it('removes invalid IDs not in allPlayers', () => {
    const result = normalizePlayingXIIds(allPlayers, ['p1', 'invalid']);
    expect(result).toContain('p1');
    expect(result).not.toContain('invalid');
  });

  it('caps at 11 players', () => {
    const ids = allPlayers.map((p) => p.id); // 12 ids
    expect(normalizePlayingXIIds(allPlayers, ids)).toHaveLength(11);
  });

  it('deduplicates IDs', () => {
    const result = normalizePlayingXIIds(allPlayers, ['p1', 'p1', 'p2']);
    expect(result.filter((id) => id === 'p1')).toHaveLength(1);
  });

  it('handles null/undefined selectedIds gracefully', () => {
    expect(normalizePlayingXIIds(allPlayers, null)).toEqual([]);
  });
});

describe('sanitizeRoles', () => {
  const selectedIds = ['p1', 'p2', 'p3'];

  it('keeps valid roles', () => {
    const result = sanitizeRoles({ captainId: 'p1', viceCaptainId: 'p2', wicketKeeperId: 'p3' }, selectedIds);
    expect(result).toEqual({ captainId: 'p1', viceCaptainId: 'p2', wicketKeeperId: 'p3' });
  });

  it('nullifies roles for players not in selectedIds', () => {
    const result = sanitizeRoles({ captainId: 'pX', viceCaptainId: 'p2', wicketKeeperId: 'pY' }, selectedIds);
    expect(result.captainId).toBeNull();
    expect(result.wicketKeeperId).toBeNull();
    expect(result.viceCaptainId).toBe('p2');
  });

  it('handles null roles gracefully', () => {
    const result = sanitizeRoles(null, selectedIds);
    expect(result.captainId).toBeNull();
  });
});

describe('pickDefaultRoles', () => {
  const players = [
    { id: 'p1', isWicketKeeper: false },
    { id: 'p2', isWicketKeeper: false },
    { id: 'p3', isWicketKeeper: true },
  ];

  it('assigns first selected player as captain', () => {
    const { captainId } = pickDefaultRoles(players, ['p1', 'p2', 'p3']);
    expect(captainId).toBe('p1');
  });

  it('assigns second selected player as vice captain', () => {
    const { viceCaptainId } = pickDefaultRoles(players, ['p1', 'p2', 'p3']);
    expect(viceCaptainId).toBe('p2');
  });

  it('assigns wicket keeper to the WK player', () => {
    const { wicketKeeperId } = pickDefaultRoles(players, ['p1', 'p2', 'p3']);
    expect(wicketKeeperId).toBe('p3');
  });

  it('falls back captain to first if only one player', () => {
    const { viceCaptainId } = pickDefaultRoles(players, ['p1']);
    expect(viceCaptainId).toBe('p1');
  });

  it('returns nulls for empty selection', () => {
    const result = pickDefaultRoles(players, []);
    expect(result.captainId).toBeNull();
  });
});

describe('buildPlayingXI', () => {
  const allPlayers = Array.from({ length: 12 }, (_, i) => ({ id: `p${i + 1}` }));

  it('returns 11 players when exactly 11 valid IDs provided', () => {
    const ids = allPlayers.slice(0, 11).map((p) => p.id);
    expect(buildPlayingXI(allPlayers, ids)).toHaveLength(11);
  });

  it('falls back to first 11 players when selection is fewer than 11', () => {
    const result = buildPlayingXI(allPlayers, ['p1', 'p2']);
    expect(result).toHaveLength(11);
    expect(result[0].id).toBe('p1');
  });

  it('returns player objects (not just IDs)', () => {
    const ids = allPlayers.slice(0, 11).map((p) => p.id);
    const result = buildPlayingXI(allPlayers, ids);
    expect(result[0]).toHaveProperty('id');
  });
});
