import { ensureTournamentNextRound, resolveWinnerFromScores } from './controllerTournamentUtils';

describe('tournament round progression', () => {
  test('keeps empty, incomplete, and final-round schedules unchanged', () => {
    const empty = [];
    expect(ensureTournamentNextRound()).toEqual([]);
    expect(ensureTournamentNextRound(empty)).toBe(empty);

    const incomplete = [
      { round: 1, isComplete: true, winnerTeam: 'A' },
      { round: 1, isComplete: false, winnerTeam: '' },
    ];
    expect(ensureTournamentNextRound(incomplete)).toBe(incomplete);

    const final = [{ round: 3, isComplete: true, winnerTeam: 'A' }];
    expect(ensureTournamentNextRound(final)).toBe(final);
  });

  test('does not create a round for missing or odd winner counts', () => {
    const oneWinner = [
      { round: 1, isComplete: true, winnerTeam: 'A' },
      { round: 1, isComplete: true, winnerTeam: '' },
    ];
    expect(ensureTournamentNextRound(oneWinner)).toBe(oneWinner);

    const oddWinners = [
      { round: 1, isComplete: true, winnerTeam: 'A' },
      { round: 1, isComplete: true, winnerTeam: 'B' },
      { round: 1, isComplete: true, winnerTeam: 'C' },
    ];
    expect(ensureTournamentNextRound(oddWinners)).toBe(oddWinners);
  });

  test('pairs winners into fixtures and avoids duplicating an existing next round', () => {
    const semifinalResults = [
      { round: 2, isComplete: true, winnerTeam: 'A' },
      { round: 2, isComplete: true, winnerTeam: 'B' },
      { round: 2, isComplete: true, winnerTeam: 'C' },
      { round: 2, isComplete: true, winnerTeam: 'D' },
    ];
    expect(ensureTournamentNextRound(semifinalResults)).toEqual([
      ...semifinalResults,
      {
        id: 'R3-M1',
        round: 3,
        matchNumber: 1,
        teamA: 'A',
        teamB: 'B',
        date: '',
        winnerTeam: '',
        summary: '',
        isComplete: false,
      },
      {
        id: 'R3-M2',
        round: 3,
        matchNumber: 2,
        teamA: 'C',
        teamB: 'D',
        date: '',
        winnerTeam: '',
        summary: '',
        isComplete: false,
      },
    ]);

    const scheduleWithFinal = [...semifinalResults, { round: 3, isComplete: false, winnerTeam: '' }];
    expect(ensureTournamentNextRound(scheduleWithFinal)).toBe(scheduleWithFinal);

    const scheduleWithNextRound = [
      ...semifinalResults,
      { round: 3, isComplete: true, winnerTeam: 'A' },
      { round: 3, isComplete: true, winnerTeam: 'B' },
      { round: 4, isComplete: false, winnerTeam: '' },
    ];
    expect(ensureTournamentNextRound(scheduleWithNextRound)).toBe(scheduleWithNextRound);
  });
});

describe('score-based match winners', () => {
  const scores = {
    firstInnings: { score: 100 },
    secondInnings: { score: 101 },
    firstInningsTeamName: 'A',
    secondInningsTeamName: 'B',
  };

  test('resolves either side winning and configurable ties', () => {
    expect(resolveWinnerFromScores(scores)).toBe('B');
    expect(resolveWinnerFromScores({ ...scores, secondInnings: { score: 99 } })).toBe('A');
    expect(resolveWinnerFromScores({ ...scores, secondInnings: { score: 100 } })).toBe('A');
    expect(resolveWinnerFromScores({ ...scores, secondInnings: { score: 100 }, tieAs: 'Shared' })).toBe('Shared');
  });
});
