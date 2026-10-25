import { buildMomRecommendations, buildMomShortlistFromScorecards } from './controllerMomUtils';

const makePlayer = (id, name) => ({
  id,
  name,
  playerType: 'batsman',
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 65,
  paceAbility: 20,
  spinAbility: 15,
});

describe('man-of-the-match scorecard shortlist', () => {
  test('combines batting and bowling contributions, parses overs, and ranks the top five', () => {
    const shortlist = buildMomShortlistFromScorecards({
      cards: [
        {
          team: 'Team A',
          scorecard: {
            battingRows: [
              { playerId: 'a1', name: 'Top Batter', runs: 50, balls: 30, isNotOut: true },
              { playerId: 'a2', name: 'All-rounder', runs: 20, balls: 20 },
              { playerId: 'a3', name: 'No Contribution', runs: 0, balls: 0 },
            ],
            bowlingRows: [
              { playerId: 'a2', name: 'All-rounder', wickets: 2, runsConceded: 20, overs: '4.0' },
              { playerId: 'a3', name: 'No Contribution', wickets: 1, runsConceded: 10, overs: 'bad' },
            ],
          },
        },
        {
          team: 'Team B',
          scorecard: {
            battingRows: [
              { playerId: 'b1', name: 'Opponent Batter', runs: 40, balls: 40 },
              { name: 'Unnamed Player', runs: 5, balls: 5 },
            ],
            bowlingRows: [{ playerId: 'b2', name: 'Opponent Bowler', wickets: 1, runsConceded: 25, overs: '3.2' }],
          },
        },
      ],
    });

    expect(shortlist).toHaveLength(5);
    expect(shortlist[0]).toMatchObject({
      rank: 1,
      recommended: true,
      playerId: 'a2',
      name: 'All-rounder',
      team: 'Team A',
    });
    expect(shortlist.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(shortlist.every((entry) => typeof entry.points === 'number')).toBe(true);
    expect(buildMomShortlistFromScorecards({ cards: [] })).toEqual([]);
  });

  test('handles missing scorecards, empty fields, and partial over notation', () => {
    expect(buildMomShortlistFromScorecards({})).toEqual([]);
    expect(buildMomShortlistFromScorecards({ cards: null })).toEqual([]);
    const shortlist = buildMomShortlistFromScorecards({
      cards: [
        { team: 'Falcons', scorecard: null },
        {
          team: 'Falcons',
          scorecard: {
            battingRows: [{ playerId: null, name: '', runs: null, balls: null }],
            bowlingRows: [
              { playerId: null, name: '', wickets: null, runsConceded: null, overs: '' },
              { playerId: 'partial-1', name: 'Partial Over', overs: '.2' },
              { playerId: 'partial-2', name: 'Partial Ball', overs: '2.' },
            ],
          },
        },
      ],
    });
    expect(shortlist.find((entry) => entry.name === 'Unknown')).toMatchObject({ team: 'Falcons' });
    expect(shortlist.find((entry) => entry.name === 'Partial Over')).toBeDefined();
    expect(shortlist.find((entry) => entry.name === 'Partial Ball')).toBeDefined();
  });
});

describe('man-of-the-match recommendations', () => {
  test('scores performance, milestones, captaincy, and winning-team role bonuses', () => {
    const ownPlayers = [
      makePlayer('own-1', 'Own Captain'),
      makePlayer('own-2', 'Own Batter'),
      { ...makePlayer('own-3', 'Own Keeper'), isWicketKeeper: true },
    ];
    const opponentPlayers = [
      makePlayer('opp-1', 'Opponent Captain'),
      makePlayer('opp-2', 'Opponent Batter'),
      { ...makePlayer('opp-3', 'Opponent Keeper'), isWicketKeeper: true },
    ];
    const recommendations = buildMomRecommendations({
      firstBattingSide: 'own',
      ownPlayers,
      opponentPlayers,
      ownTeam: 'Own Team',
      opponentTeam: 'Opponent Team',
      firstInningsTeamName: 'Own Team',
      secondInningsTeamName: 'Opponent Team',
      firstInnings: {
        score: 100,
        balls: 120,
        battingStats: [
          { runs: 100, balls: 50, isOut: false },
          { runs: 50, balls: 30, isOut: true },
          { runs: 10, balls: 20, isOut: true },
        ],
        bowlingStats: [
          { wickets: 2, balls: 24, runsConceded: 20 },
          { wickets: 1, balls: 18, runsConceded: 25 },
          { wickets: 0, balls: 12, runsConceded: 20 },
        ],
      },
      secondInnings: {
        score: 101,
        balls: 60,
        battingStats: [
          { runs: 60, balls: 35, isOut: false },
          { runs: 20, balls: 20, isOut: true },
          { runs: 0, balls: 0, isOut: false },
        ],
        bowlingStats: [
          { wickets: 1, balls: 12, runsConceded: 20 },
          { wickets: 2, balls: 18, runsConceded: 10 },
          { wickets: 0, balls: 24, runsConceded: 35 },
        ],
      },
      ownSanitizedRoles: { captainId: 'own-1', viceCaptainId: 'own-2', wicketKeeperId: 'own-3' },
      opponentSanitizedRoles: { captainId: 'opp-1', viceCaptainId: 'opp-2', wicketKeeperId: 'opp-3' },
    });

    expect(recommendations).toHaveLength(5);
    expect(recommendations[0].recommended).toBe(true);
    expect(recommendations.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(recommendations.find((entry) => entry.playerId === 'opp-1').notes).toContain('Winning team captain (+1)');
    expect(recommendations.find((entry) => entry.playerId === 'opp-2').notes).toContain('Winning team vice captain (+1)');
    expect(recommendations.find((entry) => entry.playerId === 'opp-3').notes).toContain('Winning team wicket keeper (+1)');
    expect(recommendations.find((entry) => entry.playerId === 'own-1')).toMatchObject({
      runs: 100,
      balls: 50,
      notOut: true,
      strikeRate: '200.00',
    });
  });

  test('handles missing players, unused statistics, and tied scores without winner bonuses', () => {
    const recommendations = buildMomRecommendations({
      firstBattingSide: 'opponent',
      ownPlayers: [null, makePlayer('own-1', 'Own Player')],
      opponentPlayers: [makePlayer('opp-1', 'Opponent Player')],
      ownTeam: 'Own Team',
      opponentTeam: 'Opponent Team',
      firstInningsTeamName: 'Opponent Team',
      secondInningsTeamName: 'Own Team',
      firstInnings: { score: 50, battingStats: [{ runs: 10, balls: 10 }], bowlingStats: [{ balls: 0 }] },
      secondInnings: { score: 50, battingStats: [{ runs: 0, balls: 0 }], bowlingStats: [{ balls: 0 }, { wickets: 0 }] },
      ownSanitizedRoles: { captainId: 'own-1' },
      opponentSanitizedRoles: { captainId: 'opp-1' },
    });

    expect(recommendations.every((entry) => !entry.notes.some((note) => note.startsWith('Winning team')))).toBe(true);
    expect(buildMomRecommendations({
      firstBattingSide: 'own',
      ownPlayers: [],
      opponentPlayers: [],
      ownTeam: 'Own Team',
      opponentTeam: 'Opponent Team',
      firstInnings: { score: 0, battingStats: [], bowlingStats: [] },
      secondInnings: { score: 0, battingStats: [], bowlingStats: [] },
      ownSanitizedRoles: {},
      opponentSanitizedRoles: {},
    })).toEqual([]);
  });

  test('supports sparse player profiles and awards role points to a winning own team', () => {
    const sparsePlayer = { id: 'own-sparse', name: 'Sparse Player' };
    const recommendations = buildMomRecommendations({
      firstBattingSide: 'own',
      ownPlayers: [sparsePlayer, makePlayer('own-batter', 'Own Batter')],
      opponentPlayers: [makePlayer('opp-bowler', 'Opponent Bowler')],
      ownTeam: 'Own Team',
      opponentTeam: 'Opponent Team',
      firstInningsTeamName: 'Own Team',
      secondInningsTeamName: 'Opponent Team',
      firstInnings: {
        score: 120,
        battingStats: [{ runs: 40, balls: 20, isOut: false }, { runs: 40, balls: 20, isOut: true }],
        bowlingStats: [{ wickets: 2, runsConceded: 10, balls: 12 }],
      },
      secondInnings: {
        score: 100,
        battingStats: [{ runs: 30, balls: 20, isOut: true }],
        bowlingStats: [{ wickets: 1, runsConceded: 20, balls: 12 }, { wickets: 1, runsConceded: 20, balls: 12 }],
      },
      ownSanitizedRoles: {
        captainId: 'own-sparse',
        viceCaptainId: 'own-batter',
        wicketKeeperId: 'own-sparse',
      },
      opponentSanitizedRoles: {},
    });

    expect(recommendations.find((entry) => entry.playerId === 'own-sparse').notes).toContain('Winning team captain (+1)');
    expect(recommendations.find((entry) => entry.playerId === 'own-batter').notes).toContain('Winning team vice captain (+1)');
    expect(recommendations.find((entry) => entry.playerId === 'own-sparse').notes).toContain('Winning team wicket keeper (+1)');
  });

  test('uses name ordering as the final tie breaker for players without statistics', () => {
    const recommendations = buildMomRecommendations({
      firstBattingSide: 'own',
      ownPlayers: [
        { id: 'idle-c', name: 'Idle C' },
        { id: 'idle-a', name: 'Idle A' },
        { id: 'idle-b', name: 'Idle B' },
      ],
      opponentPlayers: [],
      ownTeam: 'Own Team',
      opponentTeam: 'Opponent Team',
      firstInningsTeamName: 'Own Team',
      secondInningsTeamName: 'Opponent Team',
      firstInnings: { score: 0, battingStats: [], bowlingStats: [] },
      secondInnings: { score: 0, battingStats: [], bowlingStats: [] },
      ownSanitizedRoles: {},
      opponentSanitizedRoles: {},
    });

    expect(recommendations.map((entry) => entry.name)).toEqual(['Idle A', 'Idle B', 'Idle C']);
    expect(recommendations.every((entry) => entry.points === 0)).toBe(true);
  });
});
