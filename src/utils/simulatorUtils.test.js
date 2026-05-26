import {
  randomFrom,
  replaceName,
  getTopOpenerIndices,
  getNextBatterIndex,
  getBestBowlerIndex,
  isEligibleBowler,
  getMaxOversPerBowler,
  canSelectNextBatter,
  canSelectBowler,
  createBattingStats,
  createBowlingStats,
  formatBallProgress,
  oversDisplay,
  isInningsReadyForNextBall,
  getOpponentDecision,
  resolveResultSummary,
  stageOrder,
  battingActionList,
  bowlingActionList,
  matchVisual,
} from './simulatorUtils';

describe('randomFrom', () => {
  it('returns an element from the array', () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(randomFrom(arr));
  });

  it('returns undefined for an empty array', () => {
    expect(randomFrom([])).toBeUndefined();
  });

  it('returns the only element of a single-item array', () => {
    expect(randomFrom(['only'])).toBe('only');
  });

  it('defaults to empty array when called with no argument', () => {
    expect(randomFrom()).toBeUndefined();
  });
});

describe('replaceName', () => {
  it('replaces $$$$$ with striker name', () => {
    expect(replaceName('$$$$$ hits it!', 'Kohli', 'Rohit')).toBe('Kohli hits it!');
  });

  it('replaces ##### with partner name', () => {
    expect(replaceName('Run by #####', 'Kohli', 'Rohit')).toBe('Run by Rohit');
  });

  it('replaces both placeholders in the same line', () => {
    expect(replaceName('$$$$$ and #####', 'A', 'B')).toBe('A and B');
  });

  it('uses "Batsman" fallback when striker is falsy', () => {
    expect(replaceName('$$$$$ bats', null, 'Runner')).toBe('Batsman bats');
  });

  it('uses "Runner" fallback when partner is falsy', () => {
    expect(replaceName('run by #####', 'Kohli', null)).toBe('run by Runner');
  });

  it('replaces multiple occurrences of each placeholder', () => {
    expect(replaceName('$$$$$ $$$$$ #####', 'A', 'B')).toBe('A A B');
  });
});

describe('getTopOpenerIndices', () => {
  const makePlayers = (stats) =>
    stats.map(([batting, pace, spin]) => ({
      battingAggresion: batting,
      abilityToPlayPaceBall: pace,
      abilityToPlaySpinBall: spin,
    }));

  it('returns two best openers by combined score', () => {
    const players = makePlayers([
      [50, 60, 70], // score 180 – best
      [30, 30, 30], // score 90  – worst
      [40, 50, 60], // score 150 – second
    ]);
    const [first, second] = getTopOpenerIndices(players);
    expect(first).toBe(0);
    expect(second).toBe(2);
  });

  it('returns [0, 0] for a single player', () => {
    const players = makePlayers([[80, 80, 80]]);
    expect(getTopOpenerIndices(players)).toEqual([0, 0]);
  });

  it('returns [0, 1] for an empty list', () => {
    expect(getTopOpenerIndices([])).toEqual([0, 1]);
  });

  it('handles missing ability fields (treats as 0)', () => {
    const players = [{}, {}];
    const result = getTopOpenerIndices(players);
    expect(result).toHaveLength(2);
  });
});

describe('getNextBatterIndex', () => {
  const players = [{}, {}, {}, {}]; // 4 players, indices 0-3

  it('returns the first index not out and not occupied', () => {
    expect(getNextBatterIndex(players, [0], [1])).toBe(2);
  });

  it('returns 0 when no outs and no occupied', () => {
    expect(getNextBatterIndex(players, [], [])).toBe(0);
  });

  it('returns -1 when all players are out or occupied', () => {
    expect(getNextBatterIndex(players, [0, 1, 2], [3])).toBe(-1);
  });

  it('ignores null/undefined occupied values', () => {
    expect(getNextBatterIndex(players, [], [null, undefined])).toBe(0);
  });

  it('returns -1 when all are out', () => {
    expect(getNextBatterIndex(players, [0, 1, 2, 3], [])).toBe(-1);
  });
});

describe('getBestBowlerIndex', () => {
  const players = [
    { paceAbility: 40, spinAbility: 30 }, // score 70
    { paceAbility: 80, spinAbility: 20 }, // score 100 – best
    { paceAbility: 50, spinAbility: 60 }, // score 110 – best? no wait: 110 > 100, so index 2 is best
  ];

  it('returns the index of the highest combined bowling ability', () => {
    expect(getBestBowlerIndex(players)).toBe(2);
  });

  it('excludes the specified index and returns next best', () => {
    expect(getBestBowlerIndex(players, 2)).toBe(1);
  });

  it('returns 0 for an empty array', () => {
    expect(getBestBowlerIndex([])).toBe(0);
  });

  it('returns best bowler when excludeIndex has no valid alternative', () => {
    const single = [{ paceAbility: 70, spinAbility: 0 }];
    expect(getBestBowlerIndex(single, 0)).toBe(0);
  });
});

describe('isEligibleBowler', () => {
  it('returns true when paceAbility >= 30', () => {
    expect(isEligibleBowler({ paceAbility: 30, spinAbility: 0 })).toBe(true);
  });

  it('returns true when spinAbility >= 30', () => {
    expect(isEligibleBowler({ paceAbility: 0, spinAbility: 35 })).toBe(true);
  });

  it('returns false when both abilities are below 30', () => {
    expect(isEligibleBowler({ paceAbility: 25, spinAbility: 20 })).toBe(false);
  });

  it('returns false for wicket keeper regardless of ability', () => {
    expect(isEligibleBowler({ isWicketKeeper: true, paceAbility: 80, spinAbility: 80 })).toBe(false);
  });

  it('returns false for null/undefined player', () => {
    expect(isEligibleBowler(null)).toBe(false);
    expect(isEligibleBowler(undefined)).toBe(false);
  });

  it('returns false when ability fields are missing', () => {
    expect(isEligibleBowler({})).toBe(false);
  });
});

describe('getMaxOversPerBowler', () => {
  it('returns floor(totalOvers / 5)', () => {
    expect(getMaxOversPerBowler(20)).toBe(4);
    expect(getMaxOversPerBowler(50)).toBe(10);
    expect(getMaxOversPerBowler(10)).toBe(2);
  });

  it('returns at least 1 for very short formats', () => {
    expect(getMaxOversPerBowler(2)).toBe(1);
    expect(getMaxOversPerBowler(1)).toBe(1);
    expect(getMaxOversPerBowler(0)).toBe(1);
  });
});

describe('canSelectNextBatter', () => {
  const inningState = {
    outBatterIndices: [2, 3],
    strikerIndex: 0,
    nonStrikerIndex: 1,
  };

  it('returns false when player is out', () => {
    expect(canSelectNextBatter(inningState, 2)).toBe(false);
  });

  it('returns false when player is the current striker', () => {
    expect(canSelectNextBatter(inningState, 0)).toBe(false);
  });

  it('returns false when player is the current non-striker', () => {
    expect(canSelectNextBatter(inningState, 1)).toBe(false);
  });

  it('returns true when player is available', () => {
    expect(canSelectNextBatter(inningState, 4)).toBe(true);
  });
});

describe('canSelectBowler', () => {
  const baseInningState = {
    lastOverBowlerIndex: 1,
    bowlingStats: [
      { balls: 12 }, // index 0 – 2 overs
      { balls: 6 },  // index 1 – 1 over (also last over bowler)
      { balls: 0 },  // index 2 – 0 overs
    ],
  };

  it('returns false when bowler bowled last over', () => {
    expect(canSelectBowler({ inningState: baseInningState, bowlerIndex: 1, maxOversPerBowler: 4 })).toBe(false);
  });

  it('returns false when bowler hit over limit', () => {
    // index 0 has 12 balls = 2 overs; maxOversPerBowler=2 means limit reached (12 >= 12)
    expect(canSelectBowler({ inningState: baseInningState, bowlerIndex: 0, maxOversPerBowler: 2 })).toBe(false);
  });

  it('returns true when bowler is available', () => {
    expect(canSelectBowler({ inningState: baseInningState, bowlerIndex: 2, maxOversPerBowler: 4 })).toBe(true);
  });

  it('returns true when bowler has not hit the limit', () => {
    expect(canSelectBowler({ inningState: baseInningState, bowlerIndex: 0, maxOversPerBowler: 4 })).toBe(true);
  });
});

describe('createBattingStats', () => {
  it('creates one entry per player', () => {
    const stats = createBattingStats([{}, {}, {}]);
    expect(stats).toHaveLength(3);
  });

  it('initialises each entry with runs 0', () => {
    const [stat] = createBattingStats([{}]);
    expect(stat.runs).toBe(0);
    expect(stat.balls).toBe(0);
    expect(stat.isOut).toBe(false);
  });

  it('returns empty array for empty input', () => {
    expect(createBattingStats([])).toEqual([]);
  });
});

describe('createBowlingStats', () => {
  it('creates one entry per player', () => {
    expect(createBowlingStats([{}, {}])).toHaveLength(2);
  });

  it('initialises with balls, runsConceded, wickets all 0', () => {
    const [stat] = createBowlingStats([{}]);
    expect(stat.balls).toBe(0);
    expect(stat.runsConceded).toBe(0);
    expect(stat.wickets).toBe(0);
  });
});

describe('formatBallProgress', () => {
  it('returns "0.0" for 0 or falsy input', () => {
    expect(formatBallProgress(0)).toBe('0.0');
    expect(formatBallProgress(null)).toBe('0.0');
  });

  it('returns "0.1" for the 1st ball', () => {
    expect(formatBallProgress(1)).toBe('0.1');
  });

  it('returns "0.6" for the 6th ball', () => {
    expect(formatBallProgress(6)).toBe('0.6');
  });

  it('returns "1.1" for the 7th ball', () => {
    expect(formatBallProgress(7)).toBe('1.1');
  });

  it('returns "2.3" for the 15th ball', () => {
    expect(formatBallProgress(15)).toBe('2.3');
  });
});

describe('oversDisplay', () => {
  it('returns "0.0" for 0 balls', () => {
    expect(oversDisplay(0)).toBe('0.0');
  });

  it('returns "1.0" for 6 balls', () => {
    expect(oversDisplay(6)).toBe('1.0');
  });

  it('returns "1.3" for 9 balls', () => {
    expect(oversDisplay(9)).toBe('1.3');
  });

  it('returns "3.4" for 22 balls', () => {
    expect(oversDisplay(22)).toBe('3.4');
  });
});

describe('isInningsReadyForNextBall', () => {
  const readyState = {
    balls: 10,
    wickets: 3,
    needsOpeners: false,
    waitingForNextBatter: false,
    waitingForNextBowler: false,
    strikerIndex: 1,
    nonStrikerIndex: 2,
    currentBowlerIndex: 0,
  };

  it('returns true when everything is in order', () => {
    expect(isInningsReadyForNextBall(readyState, 120)).toBe(true);
  });

  it('returns false when ball count equals maxBalls', () => {
    expect(isInningsReadyForNextBall({ ...readyState, balls: 120 }, 120)).toBe(false);
  });

  it('returns false when 10 wickets are down', () => {
    expect(isInningsReadyForNextBall({ ...readyState, wickets: 10 }, 120)).toBe(false);
  });

  it('returns false when needsOpeners is true', () => {
    expect(isInningsReadyForNextBall({ ...readyState, needsOpeners: true }, 120)).toBe(false);
  });

  it('returns false when waitingForNextBatter is true', () => {
    expect(isInningsReadyForNextBall({ ...readyState, waitingForNextBatter: true }, 120)).toBe(false);
  });

  it('returns false when waitingForNextBowler is true', () => {
    expect(isInningsReadyForNextBall({ ...readyState, waitingForNextBowler: true }, 120)).toBe(false);
  });

  it('returns false when strikerIndex is null', () => {
    expect(isInningsReadyForNextBall({ ...readyState, strikerIndex: null }, 120)).toBe(false);
  });

  it('returns false when currentBowlerIndex is null', () => {
    expect(isInningsReadyForNextBall({ ...readyState, currentBowlerIndex: null }, 120)).toBe(false);
  });
});

describe('getOpponentDecision', () => {
  it('returns "bat" for ideal batting conditions (dead pitch + fast outfield + sunny)', () => {
    const result = getOpponentDecision({ pitch: 'dead', outfield: 'fastAndHard', weather: 'sunny' });
    expect(result).toBe('bat');
  });

  it('returns "bowl" for pace-friendly pitch with slow outfield', () => {
    const result = getOpponentDecision({ pitch: 'grassy', outfield: 'lushGreen', weather: 'rainy' });
    expect(result).toBe('bowl');
  });

  it('falls back to sporting pitch when pitch key is unknown', () => {
    // sporting: goodForBatting 7 — combined with fastAndHard outfield (9*0.45=4.05) + sunny (1.2) = 7*0.75+4.05+1.2 = 10.5 >= 7.2
    const result = getOpponentDecision({ pitch: 'unknown', outfield: 'fastAndHard', weather: 'sunny' });
    expect(result).toBe('bat');
  });

  it('returns a string ("bat" or "bowl")', () => {
    const result = getOpponentDecision({ pitch: 'sporting', outfield: 'lushGreen', weather: 'cloudy' });
    expect(['bat', 'bowl']).toContain(result);
  });
});

describe('resolveResultSummary', () => {
  it('declares second innings team winner by wickets', () => {
    const result = resolveResultSummary({
      firstInningsScore: 150,
      secondInningsScore: 155,
      secondInningsWickets: 3,
      firstInningsTeamName: 'India',
      secondInningsTeamName: 'Australia',
    });
    expect(result).toBe('Australia won by 7 wickets');
  });

  it('declares first innings team winner by runs', () => {
    const result = resolveResultSummary({
      firstInningsScore: 200,
      secondInningsScore: 180,
      secondInningsWickets: 5,
      firstInningsTeamName: 'England',
      secondInningsTeamName: 'Pakistan',
    });
    expect(result).toBe('England won by 20 runs');
  });

  it('announces a tie', () => {
    const result = resolveResultSummary({
      firstInningsScore: 175,
      secondInningsScore: 175,
      secondInningsWickets: 9,
      firstInningsTeamName: 'A',
      secondInningsTeamName: 'B',
    });
    expect(result).toBe('The match is tied. What a thriller!');
  });

  it('calculates wickets left correctly (10 - secondInningsWickets)', () => {
    const result = resolveResultSummary({
      firstInningsScore: 100,
      secondInningsScore: 101,
      secondInningsWickets: 0,
      firstInningsTeamName: 'X',
      secondInningsTeamName: 'Y',
    });
    expect(result).toBe('Y won by 10 wickets');
  });
});

describe('stageOrder', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(stageOrder)).toBe(true);
    expect(stageOrder.length).toBeGreaterThan(0);
  });
});

describe('battingActionList', () => {
  it('contains entries with key and label', () => {
    battingActionList.forEach((item) => {
      expect(item).toHaveProperty('key');
      expect(item).toHaveProperty('label');
    });
  });
});

describe('bowlingActionList', () => {
  it('contains entries with key and label', () => {
    bowlingActionList.forEach((item) => {
      expect(item).toHaveProperty('key');
      expect(item).toHaveProperty('label');
    });
  });
});

describe('matchVisual', () => {
  it('provides an emoji for common match types', () => {
    expect(typeof matchVisual.t20).toBe('string');
    expect(typeof matchVisual.ODI).toBe('string');
    expect(typeof matchVisual.test).toBe('string');
  });
});
