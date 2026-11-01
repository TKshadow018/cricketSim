const fs = require('fs');
const path = require('path');

const expectedTypes = { t20: 'T20', odi: 'ODI', test: 'Test' };
const outcomes = ['0', '1', '2', '3', '4', '6', 'wide', 'nb', 'W', 'other'];

const emptyCounts = () => ({
  attempts: 0,
  legal: 0,
  runs: 0,
  wickets: 0,
  dots: 0,
  boundaries: 0,
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0,
  outcomes: Object.fromEntries(outcomes.map((key) => [key, 0])),
  extraDetails: {
    wideRuns: {},
    noBallBatRuns: {},
    legalByeRuns: {},
    legalLegByeRuns: {},
    wideDismissals: {},
    noBallDismissals: {},
  },
});

const increment = (map, key) => { map[key] = (map[key] || 0) + 1; };

const getPhase = (format, over) => {
  if (format === 'test') return over < 10 ? 'opening' : 'established';
  if (format === 'odi') return over < 10 ? 'powerplay' : over < 40 ? 'middle' : 'death';
  if (format === 't20') return over < 6 ? 'powerplay' : over < 16 ? 'middle' : 'death';
  throw new Error(`Unsupported format: ${format}`);
};

const addDelivery = (counts, ball) => {
  const extras = ball.extras || {};
  const wide = Number(extras.wides || 0);
  const noBall = Number(extras.noballs || 0);
  const legal = wide === 0 && noBall === 0;
  const dismissals = (ball.wickets || []).filter(({ kind }) => kind !== 'retired hurt' && kind !== 'obstructing the field retired');
  const batRuns = Number(ball.runs.batter);
  const totalRuns = Number(ball.runs.total);
  counts.attempts += 1;
  counts.legal += Number(legal);
  counts.runs += totalRuns;
  counts.wickets += dismissals.length;
  counts.dots += Number(legal && totalRuns === 0);
  counts.boundaries += Number(legal && (batRuns === 4 || batRuns === 6));
  counts.wides += Number(wide > 0);
  counts.noBalls += Number(noBall > 0);
  counts.byes += Number(extras.byes || 0);
  counts.legByes += Number(extras.legbyes || 0);
  const key = wide ? 'wide' : noBall ? 'nb' : dismissals.length ? 'W' : outcomes.includes(String(batRuns)) ? String(batRuns) : 'other';
  counts.outcomes[key] += 1;
  if (wide) {
    increment(counts.extraDetails.wideRuns, wide);
    dismissals.forEach(({ kind }) => increment(counts.extraDetails.wideDismissals, kind));
  }
  if (noBall) {
    increment(counts.extraDetails.noBallBatRuns, batRuns);
    dismissals.forEach(({ kind }) => increment(counts.extraDetails.noBallDismissals, kind));
  }
  if (legal && !dismissals.length && batRuns === 0) {
    if (extras.byes) increment(counts.extraDetails.legalByeRuns, extras.byes);
    if (extras.legbyes) increment(counts.extraDetails.legalLegByeRuns, extras.legbyes);
  }
};

const summarizeMatch = (match, format) => {
  const info = match?.info;
  if (!info || !Array.isArray(info.dates) || !Array.isArray(match.innings)) {
    throw new Error('Invalid Cricsheet match: missing metadata or innings.');
  }
  if (!expectedTypes[format]) throw new Error(`Unsupported format: ${format}`);
  if (info.match_type !== expectedTypes[format] || ['no result', 'abandoned'].includes(info.outcome?.result) || info.outcome?.method) {
    return null;
  }
  const year = Number(String(info.dates[0]).slice(0, 4));
  if (!Number.isInteger(year)) throw new Error('Invalid Cricsheet match date.');
  const summary = { year, ...emptyCounts(), phases: {}, inningsScores: [] };
  const maxInnings = format === 'test' ? 4 : 2;
  const innings = match.innings.filter((entry) => !entry.super_over).slice(0, maxInnings);
  innings.forEach((entry) => {
    let score = 0;
    (entry.overs || []).forEach((over) => {
      const phase = getPhase(format, Number(over.over));
      if (!summary.phases[phase]) summary.phases[phase] = emptyCounts();
      (over.deliveries || []).forEach((ball) => {
        addDelivery(summary, ball);
        addDelivery(summary.phases[phase], ball);
        score += Number(ball.runs.total);
      });
    });
    summary.inningsScores.push(score);
  });
  return summary;
};

const sumCounts = (matches) => {
  const totals = emptyCounts();
  for (const match of matches) {
    for (const key of Object.keys(totals)) {
      if (key === 'outcomes') {
        outcomes.forEach((outcome) => { totals.outcomes[outcome] += match.outcomes[outcome]; });
      } else if (key === 'extraDetails') {
        Object.keys(totals.extraDetails).forEach((detail) => {
          Object.entries(match.extraDetails[detail]).forEach(([value, count]) => {
            totals.extraDetails[detail][value] = (totals.extraDetails[detail][value] || 0) + count;
          });
        });
      } else {
        totals[key] += match[key];
      }
    }
  }
  return totals;
};

const summarizeDirectory = (directory, format, startYear, endYear) => {
  const matches = [];
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
    const summary = summarizeMatch(data, format);
    if (summary && summary.year >= startYear && summary.year <= endYear) matches.push(summary);
  }
  return { matches, totals: sumCounts(matches) };
};

module.exports = { getPhase, summarizeMatch, summarizeDirectory, sumCounts };
