const { summarizeDirectory, sumCounts } = require('./cricsheetData.cjs');

const [format, directory, from = '2016', through = '2023'] = process.argv.slice(2);
if (!format || !directory) {
  console.error('Usage: node scripts/calibration/summarize-data.cjs <t20|odi|test> <directory> [first-year] [last-year]');
  process.exitCode = 1;
} else {
  const { matches, totals } = summarizeDirectory(directory, format, Number(from), Number(through));
  if (!matches.length) throw new Error('No matching completed matches were found.');
  const perHundred = (value) => Number((100 * value / totals.attempts).toFixed(3));
  const phaseNames = [...new Set(matches.flatMap((match) => Object.keys(match.phases)))];
  const phases = Object.fromEntries(phaseNames.map((name) => {
    const phaseTotals = sumCounts(matches.map((match) => match.phases[name]).filter(Boolean));
    return [name, {
      attempts: phaseTotals.attempts,
      legal: phaseTotals.legal,
      runs: phaseTotals.runs,
      wickets: phaseTotals.wickets,
      outcomePercent: Object.fromEntries(Object.entries(phaseTotals.outcomes)
        .map(([key, value]) => [key, Number((100 * value / phaseTotals.attempts).toFixed(3))])),
    }];
  }));
  console.log(JSON.stringify({
    format,
    years: [Number(from), Number(through)],
    matches: matches.length,
    ...totals,
    outcomePercent: Object.fromEntries(Object.entries(totals.outcomes).map(([key, value]) => [key, perHundred(value)])),
    runsPerLegalBall: Number((totals.runs / totals.legal).toFixed(4)),
    wicketsPer100LegalBalls: Number((100 * totals.wickets / totals.legal).toFixed(3)),
    phases,
  }, null, 2));
}
