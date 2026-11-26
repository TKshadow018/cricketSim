const { summarizeMatch } = require('./cricsheetData.cjs');

const dismissalKinds = {
  runOut: 'run out',
  caughtAndBowled: 'caught and bowled',
  hitWicket: 'hit wicket',
};

const convertDelivery = (event) => {
  const breakdown = event.extraBreakdown || {};
  const extras = {
    ...(breakdown.wide ? { wides: breakdown.wide } : {}),
    ...(breakdown.noBall ? { noballs: breakdown.noBall } : {}),
    ...(breakdown.bye ? { byes: breakdown.bye } : {}),
    ...(breakdown.legBye ? { legbyes: breakdown.legBye } : {}),
  };
  const extrasTotal = Object.values(extras).reduce((sum, value) => sum + value, 0);
  if (extrasTotal !== event.extras || Boolean(event.isLegalDelivery) === Boolean(extras.wides || extras.noballs)) {
    throw new Error('A simulated event has inconsistent extras or legality.');
  }
  return {
    runs: { batter: event.runs, extras: extrasTotal, total: event.runs + extrasTotal },
    extras,
    ...(event.isWicket ? { wickets: [{ kind: dismissalKinds[event.dismissal?.type] || event.dismissal?.type }] } : {}),
  };
};

const summarizeSimulation = (result, format) => {
  const innings = format === 'test'
    ? result.testMatch.innings.map((entry) => entry.innings)
    : [result.firstInnings, result.secondInnings];
  const matchType = { t20: 'T20', odi: 'ODI', test: 'Test' }[format];
  if (!matchType) throw new Error(`Unsupported simulation format: ${format}`);
  return summarizeMatch({
    info: { dates: ['2025-01-01'], match_type: matchType, outcome: { winner: 'simulated' } },
    innings: innings.map((entry) => ({
      overs: entry.deliveryEvents.map((event) => ({
        over: event.overNumber - 1,
        deliveries: [convertDelivery(event)],
      })),
    })),
  }, format);
};

module.exports = { summarizeSimulation };
