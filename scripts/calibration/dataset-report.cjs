const { summarizeDirectory } = require('./cricsheetData.cjs');
const { bootstrapIntervals, summarizeMetrics } = require('./statistics.cjs');

const [format, directory, fromText, throughText] = process.argv.slice(2);
const from = Number(fromText);
const through = Number(throughText);
if (!format || !directory || !Number.isInteger(from) || !Number.isInteger(through) || from > through) {
  throw new Error('Usage: node scripts/calibration/dataset-report.cjs <t20|odi|test> <directory> <first-year> <last-year>');
}
const { matches } = summarizeDirectory(directory, format, from, through);
console.log(JSON.stringify({
  format,
  years: [from, through],
  metrics: summarizeMetrics(matches),
  confidence95: bootstrapIntervals(matches),
}, null, 2));
