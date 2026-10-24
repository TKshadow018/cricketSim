import {
  buildCareerMatchScorecard,
  buildTopRunScorers,
  buildTopWicketTakers,
  mergePlayerStatsForCurrentMatch,
} from './controllerCareerUtils';

const ownPlayer = {
  id: 'own-1',
  name: 'Own Batter',
  playerType: 'batsman',
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 65,
  paceAbility: 10,
  spinAbility: 12,
  battingOrderCoeff: 80,
};
const opponentPlayer = {
  id: 'opp-1',
  name: 'Opponent Bowler',
  playerType: 'bowler spinner',
  abilityToPlayPaceBall: 20,
  abilityToPlaySpinBall: 25,
  paceAbility: 12,
  spinAbility: 70,
  battingOrderCoeff: 20,
};

describe('career tables and match aggregation', () => {
  test('ranks top run scorers and calculates averages and strike rates safely', () => {
    const players = [
      { name: 'Out Batter', runs: 100, outs: 2, balls: 80 },
      { name: 'Not Out Batter', runs: 100, outs: 0, balls: 60 },
      { name: 'No Ball Faced', runs: 10, outs: 1, balls: 0 },
      { name: 'Zero Alpha', runs: 0, outs: 0, balls: 0 },
      { name: 'Zero Beta', runs: 0, outs: 0, balls: 0 },
    ];

    const result = buildTopRunScorers(players);

    expect(result.map(({ name }) => name)).toEqual(['Not Out Batter', 'Out Batter', 'No Ball Faced', 'Zero Alpha', 'Zero Beta']);
    expect(result[0]).toMatchObject({ battingAverage: 'NA', strikeRate: '166.67' });
    expect(result[1]).toMatchObject({ battingAverage: '50.00', strikeRate: '125.00' });
    expect(result[2]).toMatchObject({ battingAverage: '10.00', strikeRate: '0.00' });
    expect(buildTopRunScorers()).toEqual([]);
    expect(players[0].runs).toBe(100);
  });

  test('ranks wicket takers and formats bowling figures including empty bowling records', () => {
    const players = [
      { name: 'Economical', wickets: 3, ballsBowled: 24, runsConceded: 20 },
      { name: 'No Wickets', wickets: 0, ballsBowled: 0, runsConceded: 0 },
      { name: 'More Wickets', wickets: 3, ballsBowled: 30, runsConceded: 45 },
      { name: 'Zero Alpha', wickets: 0, ballsBowled: 0, runsConceded: 0 },
      { name: 'Zero Beta', wickets: 0, ballsBowled: 0, runsConceded: 0 },
    ];

    const result = buildTopWicketTakers(players);

    expect(result.map(({ name }) => name)).toEqual(['Economical', 'More Wickets', 'No Wickets', 'Zero Alpha', 'Zero Beta']);
    expect(result[0]).toMatchObject({ overs: '4.0', bowlingAverage: '6.67', economy: '5.00' });
    expect(result[2]).toMatchObject({ overs: '0.0', bowlingAverage: 'NA', economy: '0.00' });
    expect(buildTopWicketTakers()).toEqual([]);
  });

  test('merges current match contributions with career and format totals', () => {
    const key = 'Own Team::own-1::Own Batter';
    const existingStats = {
      [key]: {
        key,
        playerId: 'own-1',
        team: 'Own Team',
        name: 'Own Batter',
        runs: 5,
        outs: 1,
        wickets: 0,
        balls: 3,
        ballsBowled: 6,
        runsConceded: 4,
        matches: 2,
        formatStats: { t20: { runs: 5, outs: 1, wickets: 0, balls: 3, ballsBowled: 6, runsConceded: 4, matches: 2 } },
      },
    };
    const stats = mergePlayerStatsForCurrentMatch({
      existingStats,
      firstBattingSide: 'own',
      ownPlayers: [ownPlayer],
      opponentPlayers: [opponentPlayer],
      ownTeam: 'Own Team',
      opponentTeam: 'Opposition',
      firstInnings: {
        battingStats: [{ runs: 30, balls: 20, isOut: true }],
        bowlingStats: [{ wickets: 2, balls: 18, runsConceded: 22 }],
      },
      secondInnings: {
        battingStats: [{ runs: 15, balls: 10, isOut: false }],
        bowlingStats: [{ wickets: 1, balls: 12, runsConceded: 15 }],
      },
      matchFormat: 'odi',
    });

    expect(stats[key]).toMatchObject({
      runs: 35,
      outs: 2,
      balls: 23,
      ballsBowled: 18,
      runsConceded: 19,
      matches: 3,
      formatStats: {
        t20: { runs: 5, matches: 2 },
        odi: { runs: 30, outs: 1, balls: 20, wickets: 1, matches: 1 },
      },
    });
    expect(stats['Opposition::opp-1::Opponent Bowler']).toMatchObject({
      runs: 15,
      outs: 0,
      wickets: 2,
      balls: 10,
      ballsBowled: 18,
      runsConceded: 22,
      matches: 1,
    });
    expect(existingStats[key].runs).toBe(5);
  });

  test('builds scorecards for either first batting side with dismissal and default row states', () => {
    const scorecard = buildCareerMatchScorecard({
      firstBattingSide: 'opponent',
      ownPlayers: [ownPlayer, null],
      opponentPlayers: [opponentPlayer],
      ownTeam: 'Own Team',
      opponentTeam: 'Opposition',
      firstInnings: {
        score: 80,
        wickets: 1,
        balls: 25,
        strikerIndex: 0,
        nonStrikerIndex: null,
        currentBowlerIndex: 0,
        battingStats: [{ runs: 20, balls: 15, isOut: true, outByBowler: 'Own Batter', outAtScore: '40/1', outAtBall: '4.3' }],
        bowlingStats: [{ balls: 18, runsConceded: 22, wickets: 1 }],
      },
      secondInnings: {
        score: 81,
        wickets: 0,
        balls: 30,
        strikerIndex: 0,
        nonStrikerIndex: null,
        currentBowlerIndex: 0,
        battingStats: [{ runs: 35, balls: 20, isOut: false }],
        bowlingStats: [{ balls: 0, runsConceded: 0, wickets: 0 }],
      },
    });

    expect(scorecard.previousInnings).toMatchObject({
      title: 'Opposition Innings',
      line: 'Opposition Innings 80/1',
      overs: '4.1',
      battingRows: [expect.objectContaining({ dismissal: 'b Own Batter @ 40/1 (4.3)', isNotOut: false })],
      bowlingRows: [expect.objectContaining({ overs: '3.0', economy: '7.33', avgPerWicket: '22.00' })],
    });
    expect(scorecard.currentInnings).toMatchObject({
      title: 'Own Team Innings',
      battingRows: [expect.objectContaining({ dismissal: 'Not Out', isNotOut: true })],
      bowlingRows: [],
    });
  });

  test('merges sparse opponent-first innings with default career metadata and format totals', () => {
    const sparsePlayer = { name: 'Sparse Player', fitness: null, morale: null, battingOrderCoeff: 0 };
    const stats = mergePlayerStatsForCurrentMatch({
      existingStats: null,
      firstBattingSide: 'opponent',
      ownPlayers: [sparsePlayer],
      opponentPlayers: [],
      ownTeam: 'Own Team',
      opponentTeam: 'Opposition',
      firstInnings: { battingStats: [], bowlingStats: [] },
      secondInnings: { battingStats: [], bowlingStats: [] },
    });

    expect(stats['Own Team::undefined::Sparse Player']).toMatchObject({
      playerId: undefined,
      playerType: '',
      paceAbility: 0,
      spinAbility: 0,
      abilityToPlayPaceBall: 0,
      abilityToPlaySpinBall: 0,
      fitness: 100,
      morale: 50,
      runs: 0,
      matches: 1,
      formatStats: {
        t20: { runs: 0, matches: 1 },
      },
    });
  });

  test('uses omitted scorecard defaults and sparse scorecard rows safely', () => {
    const defaulted = buildCareerMatchScorecard({
      firstBattingSide: 'own',
      ownPlayers: [
        { name: 'Dismissed Without Details' },
        { name: 'Yet To Bat' },
      ],
      opponentPlayers: [{ name: 'Unbowled Opponent' }],
      ownTeam: '',
      opponentTeam: '',
      firstInningsTeamName: '',
      secondInningsTeamName: '',
      firstInnings: {
        score: 10,
        wickets: 1,
        strikerIndex: null,
        nonStrikerIndex: null,
        battingStats: [{ isOut: true }],
      },
      secondInnings: {
        score: 0,
        wickets: 0,
        strikerIndex: null,
        nonStrikerIndex: null,
      },
    });
    expect(defaulted.previousInnings.title).toBe('First Innings');
    expect(defaulted.currentInnings.title).toBe('Second Innings');
    expect(defaulted.previousInnings.battingRows).toEqual([
      expect.objectContaining({ dismissal: 'b Unknown @ - (-)', isNotOut: false }),
      expect.objectContaining({ dismissal: 'Yet to bat', isNotOut: false }),
    ]);
    expect(defaulted.previousInnings.bowlingRows).toEqual([]);

    const noArguments = buildCareerMatchScorecard({
      firstInnings: { score: 0, wickets: 0 },
      secondInnings: { score: 0, wickets: 0 },
    });
    expect(noArguments.previousInnings.title).toBe('First Innings');
    expect(noArguments.currentInnings.title).toBe('Second Innings');

    const nullRosters = buildCareerMatchScorecard({
      firstBattingSide: 'own',
      ownPlayers: null,
      opponentPlayers: null,
      firstInnings: { score: 0, wickets: 0 },
      secondInnings: { score: 0, wickets: 0 },
    });
    expect(nullRosters.previousInnings.battingRows).toEqual([]);
    expect(nullRosters.currentInnings.bowlingRows).toEqual([]);
  });
});
