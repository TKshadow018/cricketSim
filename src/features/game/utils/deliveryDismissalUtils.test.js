import { formatDismissal } from './deliveryDismissalUtils';

test.each([
  [{ type: 'runOut', fielderName: 'Fielder' }, '', 'run out (Fielder)'],
  [{ type: 'runOut' }, '', 'run out'],
  [{ type: 'caught', fielderName: 'Fielder' }, 'Bowler', 'c Fielder b Bowler'],
  [{ type: 'caughtAndBowled' }, 'Bowler', 'c & b Bowler'],
  [{ type: 'lbw' }, 'Bowler', 'lbw b Bowler'],
  [{ type: 'stumped', fielderName: 'Keeper' }, 'Bowler', 'st Keeper b Bowler'],
  [{ type: 'hitWicket' }, 'Bowler', 'hit wicket b Bowler'],
  [{ type: 'bowled' }, 'Bowler', 'b Bowler'],
  [undefined, 'Bowler', 'b Bowler'],
])('formats a structured or legacy dismissal', (dismissal, outByBowler, prefix) => {
  expect(formatDismissal({ dismissal, outByBowler, outAtScore: '30/1', outAtBall: '4.2' }))
    .toBe(`${prefix} @ 30/1 (4.2)`);
});
