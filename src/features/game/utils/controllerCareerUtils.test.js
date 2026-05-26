import {
  buildTopRunScorers,
  buildTopWicketTakers,
  mergePlayerStatsForCurrentMatch,
} from './controllerCareerUtils';

const makeEntry = (overrides = {}) => ({
  key: 'team::id::name',
  team: 'India',
  name: 'Player',
  runs: 0,
  outs: 0,
  wickets: 0,
  balls: 0,
  ballsBowled: 0,
  runsConceded: 0,
  matches: 1,
  ...overrides,
});

describe('buildTopRunScorers', () => {
  it('sorts by runs descending', () => {
    const list = [
      makeEntry({ name: 'B', runs: 50, balls: 40, outs: 1 }),
      makeEntry({ name: 'A', runs: 80, balls: 60, outs: 1 }),
      makeEntry({ name: 'C', runs: 30, balls: 25, outs: 0 }),
    ];
    const result = buildTopRunScorers(list);
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
    expect(result[2].name).toBe('C');
  });

  it('limits to 10 entries', () => {
    const list = Array.from({ length: 15 }, (_, i) => makeEntry({ name: `P${i}`, runs: i * 10 }));
    expect(buildTopRunScorers(list)).toHaveLength(10);
  });

  it('calculates battingAverage when outs > 0', () => {
    const list = [makeEntry({ runs: 100, outs: 4, balls: 80 })];
    const [result] = buildTopRunScorers(list);
    expect(result.battingAverage).toBe('25.00');
  });

  it('returns "NA" for battingAverage when no dismissals', () => {
    const list = [makeEntry({ runs: 60, outs: 0, balls: 45 })];
    const [result] = buildTopRunScorers(list);
    expect(result.battingAverage).toBe('NA');
  });

  it('calculates strikeRate correctly', () => {
    const list = [makeEntry({ runs: 60, balls: 40, outs: 1 })];
    const [result] = buildTopRunScorers(list);
    expect(result.strikeRate).toBe('150.00');
  });

  it('returns "0.00" for strikeRate when no balls faced', () => {
    const list = [makeEntry({ runs: 10, balls: 0, outs: 0 })];
    const [result] = buildTopRunScorers(list);
    expect(result.strikeRate).toBe('0.00');
  });

  it('breaks runs tie by fewer balls faced', () => {
    const list = [
      makeEntry({ name: 'Slow', runs: 50, balls: 60, outs: 1 }),
      makeEntry({ name: 'Fast', runs: 50, balls: 40, outs: 1 }),
    ];
    expect(buildTopRunScorers(list)[0].name).toBe('Fast');
  });

  it('does not mutate the input list', () => {
    const list = [makeEntry({ runs: 30, balls: 25, outs: 1 })];
    const original = [...list];
    buildTopRunScorers(list);
    expect(list).toEqual(original);
  });
});

describe('buildTopWicketTakers', () => {
  it('sorts by wickets descending', () => {
    const list = [
      makeEntry({ name: 'B', wickets: 3, ballsBowled: 24, runsConceded: 40 }),
      makeEntry({ name: 'A', wickets: 5, ballsBowled: 30, runsConceded: 50 }),
    ];
    expect(buildTopWicketTakers(list)[0].name).toBe('A');
  });

  it('limits to 10 entries', () => {
    const list = Array.from({ length: 12 }, (_, i) => makeEntry({ name: `P${i}`, wickets: i }));
    expect(buildTopWicketTakers(list)).toHaveLength(10);
  });

  it('calculates economy correctly', () => {
    const list = [makeEntry({ wickets: 2, ballsBowled: 24, runsConceded: 40 })];
    const [result] = buildTopWicketTakers(list);
    // economy = (40 * 6) / 24 = 10.00
    expect(result.economy).toBe('10.00');
  });

  it('returns "0.00" economy when no balls bowled', () => {
    const list = [makeEntry({ wickets: 0, ballsBowled: 0, runsConceded: 0 })];
    const [result] = buildTopWicketTakers(list);
    expect(result.economy).toBe('0.00');
  });

  it('calculates bowlingAverage when wickets > 0', () => {
    const list = [makeEntry({ wickets: 4, runsConceded: 60, ballsBowled: 30 })];
    const [result] = buildTopWicketTakers(list);
    expect(result.bowlingAverage).toBe('15.00');
  });

  it('returns "NA" for bowlingAverage when wickets is 0', () => {
    const list = [makeEntry({ wickets: 0, runsConceded: 30, ballsBowled: 18 })];
    const [result] = buildTopWicketTakers(list);
    expect(result.bowlingAverage).toBe('NA');
  });

  it('appends formatted overs field', () => {
    const list = [makeEntry({ wickets: 1, ballsBowled: 12, runsConceded: 20 })];
    const [result] = buildTopWicketTakers(list);
    expect(result.overs).toBe('2.0');
  });
});

describe('mergePlayerStatsForCurrentMatch', () => {
  const makePlayers = (ids) => ids.map((id) => ({ id, name: `Player ${id}` }));

  const firstInnings = {
    battingStats: [{ runs: 50, balls: 40, isOut: true }],
    bowlingStats: [{ wickets: 2, balls: 18, runsConceded: 30 }],
    score: 150,
  };
  const secondInnings = {
    battingStats: [{ runs: 30, balls: 25, isOut: false }],
    bowlingStats: [{ wickets: 1, balls: 12, runsConceded: 20 }],
    score: 140,
  };

  it('creates new stat entries when existingStats is empty', () => {
    const merged = mergePlayerStatsForCurrentMatch({
      existingStats: {},
      firstBattingSide: 'own',
      ownPlayers: makePlayers(['p1']),
      opponentPlayers: makePlayers(['p2']),
      ownTeam: 'India',
      opponentTeam: 'Australia',
      firstInnings,
      secondInnings,
    });
    expect(Object.keys(merged).length).toBeGreaterThan(0);
  });

  it('merges runs into existing stats', () => {
    const existing = {
      'India::p1::Player p1': {
        key: 'India::p1::Player p1',
        team: 'India',
        name: 'Player p1',
        runs: 20,
        outs: 0,
        wickets: 0,
        balls: 10,
        ballsBowled: 0,
        runsConceded: 0,
        matches: 1,
      },
    };
    const merged = mergePlayerStatsForCurrentMatch({
      existingStats: existing,
      firstBattingSide: 'own',
      ownPlayers: makePlayers(['p1']),
      opponentPlayers: makePlayers(['p2']),
      ownTeam: 'India',
      opponentTeam: 'Australia',
      firstInnings,
      secondInnings,
    });
    expect(merged['India::p1::Player p1'].runs).toBeGreaterThanOrEqual(20);
  });

  it('increments matches count by 1', () => {
    const existing = {
      'India::p1::Player p1': {
        key: 'India::p1::Player p1',
        team: 'India',
        name: 'Player p1',
        runs: 0,
        outs: 0,
        wickets: 0,
        balls: 0,
        ballsBowled: 0,
        runsConceded: 0,
        matches: 3,
      },
    };
    const merged = mergePlayerStatsForCurrentMatch({
      existingStats: existing,
      firstBattingSide: 'own',
      ownPlayers: makePlayers(['p1']),
      opponentPlayers: makePlayers(['p2']),
      ownTeam: 'India',
      opponentTeam: 'Australia',
      firstInnings,
      secondInnings,
    });
    expect(merged['India::p1::Player p1'].matches).toBe(4);
  });

  it('works with firstBattingSide = "opponent"', () => {
    const merged = mergePlayerStatsForCurrentMatch({
      existingStats: {},
      firstBattingSide: 'opponent',
      ownPlayers: makePlayers(['p1']),
      opponentPlayers: makePlayers(['p2']),
      ownTeam: 'India',
      opponentTeam: 'Australia',
      firstInnings,
      secondInnings,
    });
    expect(Object.keys(merged).length).toBeGreaterThan(0);
  });
});
