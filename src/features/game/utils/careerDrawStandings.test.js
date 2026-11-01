import { buildCareerStandings } from './careerSeasonScheduleUtils';

jest.mock('faker-user', () => ({ createPerson: jest.fn() }));

test('a first-class draw is recorded separately and gives each side one point', () => {
  const standings = buildCareerStandings('A', [{
    format: 'firstClass',
    teamA: 'A',
    teamB: 'B',
    isComplete: true,
    result: { winner: 'Draw' },
  }], [{ name: 'A' }, { name: 'B' }]);
  expect(standings.firstClass.A).toMatchObject({ played: 1, wins: 0, losses: 0, draws: 1, points: 1 });
  expect(standings.firstClass.B).toMatchObject({ played: 1, wins: 0, losses: 0, draws: 1, points: 1 });
});
