const path = require('path');
const webpack = require(require.resolve('webpack', { paths: [require.resolve('react-scripts/package.json')] }));

const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error('Provide an output directory outside the source tree.');

webpack({
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, 'benchmark.js'),
  output: { path: path.resolve(outputDirectory), filename: 'calibration-benchmark.cjs' },
  optimization: { minimize: false },
}, (error, stats) => {
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({ all: false, errors: true }));
    process.exitCode = 1;
    return;
  }
  console.log(stats.toString({ all: false, errors: true, warnings: true }));
});
