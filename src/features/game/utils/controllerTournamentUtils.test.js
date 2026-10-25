import {
  ensureTournamentNextRound,
  resolveWinnerFromScores,
} from './controllerTournamentUtils';

const makeMatch = (round, matchNumber, isComplete, winnerTeam = '') => ({
  id: `R${round}-M${matchNumber}`,
  round,
  matchNumber,
  teamA: `TeamA${matchNumber}`,
  teamB: `TeamB${matchNumber}`,
  date: '2024-01-01',
  winnerTeam,
  summary: '',
  isComplete,
});

describe('ensureTournamentNextRound', () => {
  it('returns matches unchanged when latest round is not complete', () => {
    const matches = [makeMatch(1, 1, false), makeMatch(1, 2, false)];
    expect(ensureTournamentNextRound(matches)).toEqual(matches);
  });

  it('returns matches unchanged when only one match in latest round (final)', () => {
    const matches = [
      makeMatch(1, 1, true, 'India'),
      makeMatch(1, 2, true, 'Australia'),
      makeMatch(2, 1, true, 'India'),
    ];
    expect(ensureTournamentNextRound(matches)).toEqual(matches);
  });

  it('appends next round fixtures when latest round is complete with even winners', () => {
    const matches = [
      makeMatch(1, 1, true, 'India'),
      makeMatch(1, 2, true, 'Australia'),
      makeMatch(1, 3, true, 'England'),
      makeMatch(1, 4, true, 'Pakistan'),
    ];
    const result = ensureTournamentNextRound(matches);
    const round2 = result.filter((m) => m.round === 2);
    expect(round2).toHaveLength(2);
    expect(round2[0].teamA).toBe('India');
    expect(round2[0].teamB).toBe('Australia');
  });

  it('does not add round if next round already exists', () => {
    const matches = [
      makeMatch(1, 1, true, 'India'),
      makeMatch(1, 2, true, 'Australia'),
      makeMatch(2, 1, false),
    ];
    const result = ensureTournamentNextRound(matches);
    expect(result.filter((m) => m.round === 2)).toHaveLength(1);
  });

  it('returns matches unchanged for empty input', () => {
    expect(ensureTournamentNextRound([])).toEqual([]);
  });

  it('does not advance when winners count is odd', () => {
    const matches = [
      makeMatch(1, 1, true, 'India'),
      makeMatch(1, 2, true, 'Australia'),
      makeMatch(1, 3, true, 'England'),
    ];
    // 3 winners → odd → no next round
    const result = ensureTournamentNextRound(matches);
    expect(result.filter((m) => m.round === 2)).toHaveLength(0);
  });

  it('sets isComplete to false on new round fixtures', () => {
    const matches = [
      makeMatch(1, 1, true, 'India'),
      makeMatch(1, 2, true, 'Australia'),
    ];
    const result = ensureTournamentNextRound(matches);
    const nextRound = result.filter((m) => m.round === 2);
    expect(nextRound[0].isComplete).toBe(false);
  });
});

describe('resolveWinnerFromScores', () => {
  it('returns secondInningsTeamName when second innings score is higher', () => {
    expect(
      resolveWinnerFromScores({
        firstInnings: { score: 150 },
        secondInnings: { score: 160 },
        firstInningsTeamName: 'India',
        secondInningsTeamName: 'Australia',
      })
    ).toBe('Australia');
  });

  it('returns firstInningsTeamName when first innings score is higher', () => {
    expect(
      resolveWinnerFromScores({
        firstInnings: { score: 200 },
        secondInnings: { score: 180 },
        firstInningsTeamName: 'England',
        secondInningsTeamName: 'Pakistan',
      })
    ).toBe('England');
  });

  it('returns tieAs value when scores are equal and tieAs is provided', () => {
    expect(
      resolveWinnerFromScores({
        firstInnings: { score: 175 },
        secondInnings: { score: 175 },
        firstInningsTeamName: 'A',
        secondInningsTeamName: 'B',
        tieAs: 'A',
      })
    ).toBe('A');
  });

  it('returns firstInningsTeamName on tie when tieAs is not provided', () => {
    expect(
      resolveWinnerFromScores({
        firstInnings: { score: 100 },
        secondInnings: { score: 100 },
        firstInningsTeamName: 'X',
        secondInningsTeamName: 'Y',
      })
    ).toBe('X');
  });
});
