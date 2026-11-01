# Match outcome models

## Choosing a ruleset

On **Choose Game Mode**, select **Arcade** or **Realism** before choosing the
match or career mode. The choice is saved with the game. Saves made before this
setting existed load as Arcade.

- **Arcade** retains the original discrete outcome weights, player and team
  skill bonuses, captain bonuses, Super Shots, and Special Deliveries. Its Test
  selections remain simplified one-innings-per-team matches.
- **Realism** uses continuous, format- and phase-specific probabilities,
  two-sided tactical plans, approximate field geometry, and the restrictions
  below. Arcade skills, captain bonuses, Super Shots, and Special Deliveries
  are disabled in this mode. It is an approximation, not an official cricket
  rules engine or a prediction service.

The original [outcome analysis](./match-outcome-analysis.md) is a historical
audit of the earlier engine. This document describes the current implementation.

## Deliveries, fielding, and scoring

The fielding side chooses its field and bowling plan before the batter's shot
is resolved. The computer selects its own batting or bowling plan when that
side is not controlled by the user. Intended shot direction and length can
deviate during execution. Field coverage uses the displayed coordinates and
the actual sampled sector on both sides: an infield fielder affects rotation,
while a deep fielder can reduce ground boundaries and affect aerial catches.
Uncovered sectors provide a small scoring opportunity. A positioned fielder
near the sector can be credited for a catch or run-out.

The position-to-player assignment follows the bowling XI order, excluding the
bowler and wicketkeeper. An optional `fieldingAbility` changes coverage strength;
missing values use 50. `battingHand: 'left'` mirrors the batting sector and
leg-side restrictions; players without that property are treated as right-handed.
The map uses approximate geometry, not a physical ball-flight or interception
simulation. The data used for calibration does not contain field coordinates,
so field and execution effects are heuristic and have not been independently
fitted.

In Realism, an illegal user field is explained in the bowling panel and a ball
is not delivered until the field is corrected. The computer selects a legal
preset before the shot. The implementation uses the inner ellipse shown on the
field map and enforces:

- T20: at most two fielders outside the circle in the first six overs and five
  afterwards. T10 uses two opening overs; micro and mini have simplified
  powerplays.
- ODI: at most two in the first ten overs, four through over 40, and five
  afterwards. A Super Over permits two outside the circle.
- Limited-overs matches permit at most five fielders on the leg side; all
  formats permit at most two behind the popping crease on the leg side.
  The bowler and wicketkeeper are fixed separately.

These are a simplified implementation of common restrictions. Other competition
conditions, substitutions, delayed starts, penalties, and unusual fielding
scenarios are not modeled. In Arcade, custom fields continue to use their
closest preset's abstract modifiers and are not restricted.

An event records bat runs, extras, legal-ball status, completed runs, tactics,
and structured dismissal information. No-balls count as balls faced but not
legal deliveries. Wides and no-balls can include additional runs; Realism also
samples byes, leg-byes, and selected run-outs or stumpings. A free hit survives
wides and further no-balls, protects either side from ordinary dismissals, and
still permits run-outs. Realism Test and first-class matches do not award a
free hit after a no-ball. The engine does not yet generate every legal
combination, including byes or leg-byes on a no-ball.

The over completes once after its sixth legal ball, even if a replacement
batter is still being selected. Scorecards derive dismissal and bowler credit
from the same event; a run-out is not credited to the bowler. Player-of-the-match
shortlists are estimates, not official adjudications.

## Formats, tournaments, and careers

- A Realism Test has up to four innings, a five-day limit of 90 legal overs per
  day, declarations, a follow-on decision, aggregate targets, innings wins,
  ties, and time-expiry draws. The user controls declarations and follow-on
  decisions for their team; the computer uses a simple declaration heuristic
  and enforces an available follow-on. Career first-class fixtures use four
  days. This is an overs-based clock: breaks, rain interruptions, DLS, actual
  playing time, and lost-time follow-on adjustments are not modeled.
- A tied tournament match remains a tie in match history and is resolved by
  repeated Super Overs. The user plays them when their team is involved;
  otherwise they are simulated. Previously dismissed Super Over batters are
  ineligible later, and a bowler cannot bowl consecutive Super Overs. If too
  few eligible players remain, the game reports the limitation instead of
  inventing a winner.
- A drawn Test knockout advances the side with the first-innings lead; if those
  innings are level, the fixture is replayed. The match itself remains a draw.
- With complete XIs, unattended T20, ODI, and first-class career fixtures use
  the same delivery and scoring engine as live play. Their scorecards, margins,
  player statistics, and player-of-the-match shortlist are derived from those
  innings. First-class results retain each innings separately.
- For compatibility, Arcade still has an older synthetic fallback for malformed
  or incomplete legacy rosters and unsupported fixture formats. That fallback
  is an estimate and does **not** satisfy the event-ledger or scorecard
  guarantees of the shared engine. Realism reports incomplete rosters as an
  error and keeps previously simulated fixtures.

## Reproducibility and saves

New matches persist the `match-engine-v1` / `mulberry32-v1` seed and generator
state. Toss/weather, innings seeds, delivery outcomes, computer bowling choices,
and commentary use seeded draws. Unattended fixtures also seed squad rotation
and post-match updates. Given the same saved state, engine version, lineups,
and user choices, a resumed innings produces the same events. Setup choices and
pre-match roster generation remain inputs to the replay; a seed alone is not a
complete match recording.

The UI shows the latest 60 deliveries, while new innings retain a complete
`deliveryEvents` ledger. Older saves preserve the history they contain but set
`historyComplete` to false if play had already started; an old mid-innings save
without a random state cannot be replayed deterministically before migration.

Large manual and automatic game/career saves are gzip-compressed in the
Firebase service layer. Legacy uncompressed saves still load. Compression is
not encryption. Browsers without `CompressionStream` / `DecompressionStream`
can use small legacy saves, but receive an explicit message if a large save
requires unsupported compression. Autosave failures are surfaced to the user.
In a 100-match Test benchmark the largest Test state was approximately 3.6 MB
as JSON and 56 KB as gzip, before base64 and other save metadata. The service
rejects encoded payloads above 900,000 bytes rather than attempting an oversized
Firestore write. Closing a browser during an asynchronous save cannot guarantee
that the write has completed.

## Calibration and measured limitations

The Realism phase tables and conditional extras distributions were derived from
Cricsheet men's international JSON data for 2016–2023. Completed matches with a
recorded DLS/other adjustment or no result were excluded; Super Overs were
excluded. Training contained 1,469 T20Is, 777 ODIs, and 317 Tests. Percentages
are per attempted delivery in the parameter tables; reported runs and wickets
below use legal-ball denominators. Rare unrepresented scoring categories were
not fitted. T10, mini, and micro use simplified fallback parameters.

**Attribution:** This product uses data from [Cricsheet](https://cricsheet.org/),
available under the [Open Data Commons Attribution License 1.0](http://opendatacommons.org/licenses/by/1.0/).
The original archives and license notices are not redistributed in this
repository. Data was downloaded on 1 November 2026 from the official
[downloads page](https://cricsheet.org/downloads/). SHA-256 fingerprints:

| Archive | SHA-256 |
| --- | --- |
| `t20s_male_json.zip` | `691f1f42b86c93fbdbc53936ed69479f9306bf39c4c56b4c0729360051075c6d` |
| `odis_male_json.zip` | `8518aa42ff388c3f6fca06661bba839e8756680c3a35adbfa851f45364675224` |
| `tests_male_json.zip` | `cb8593cdad57b6de11f18dca778dd8776d0b3aab4eb5dfe3880a68a0e1e213cb` |
| `ipl_male_json.zip` | `6fe9142db9e139e4f77a5634ddc61c1c72a26a56bee2fe5affe5921867de04b3` |
| `odis_female_json.zip` | `72ee65967d56fa792d7ca4699f724ecad0f28d908b74fc92855b758b6ee4f646` |
| `tests_female_json.zip` | `facd6799786bba57d057b4828cb9fe64459cd6eb99991304dddd6bda7d774458` |

The following comparisons use equal synthetic teams with batting and bowling
ability 70, a sporting pitch, lush outfield, and cloudy weather. They are not a
simulation of the historical lineups or venues. There were 500 T20, 300 ODI,
and 100 Test simulations per model, with seed `20261101`.

| Format | Measure | 2024–2026 men's internationals | Arcade baseline | Realism |
| --- | --- | ---: | ---: | ---: |
| T20I | Runs / legal ball | 1.251 | 1.633 | 1.256 |
| T20I | Wickets / 100 legal balls | 6.156 | 7.219 | 6.231 |
| T20I | Boundaries / 100 legal balls | 14.305 | 18.818 | 13.642 |
| ODI | Runs / legal ball | 0.880 | 0.950 | 0.851 |
| ODI | Wickets / 100 legal balls | 2.940 | 3.322 | 3.054 |
| ODI | Boundaries / 100 legal balls | 9.369 | 8.727 | 8.191 |
| Test | Runs / legal ball | 0.604 | 0.555 | 0.536 |
| Test | Wickets / 100 legal balls | 2.040 | 1.050 | 1.815 |
| Test | Boundaries / 100 legal balls | 6.982 | 4.111 | 6.156 |

For comparison, the Test baseline above uses Arcade delivery weights within the
new five-day Test kernel; the playable Arcade Test is still simplified. These
international 2024–2026 results were **inspected during tactical tuning**, so
they are a validation/selection set, not an untouched holdout. Some metrics
remain worse than the Arcade baseline, notably ODI boundaries and Test run rate.
No numerical acceptance tolerance was fixed before tuning; the table is not a
claim that a realism threshold has been met.

Match-level bootstrap 95% intervals (400 resamples, seed 41) illustrate the
remaining differences:

| Format | Measure | Historical interval | Realism simulation interval |
| --- | --- | --- | --- |
| T20I | Runs / legal ball | 1.239–1.263 | 1.245–1.267 |
| T20I | Wickets / 100 legal balls | 6.082–6.240 | 6.100–6.363 |
| ODI | Runs / legal ball | 0.858–0.897 | 0.843–0.859 |
| ODI | Wickets / 100 legal balls | 2.865–3.026 | 2.988–3.117 |
| Test | Runs / legal ball | 0.589–0.617 | 0.530–0.541 |
| Test | Wickets / 100 legal balls | 1.936–2.154 | 1.755–1.878 |

An untouched, out-of-population check was made after these parameters were
chosen: 213 IPL matches from 2024–2026, 490 women's ODIs and 15 women's Tests
from 2016–2026. Their runs per legal ball were respectively 1.617
(95% interval 1.587–1.649), 0.783 (0.770–0.797), and 0.533
(0.495–0.574), compared with the same Realism simulations above. IPL scoring
is substantially underpredicted; the women's Test sample is small. These
different competitions and populations are robustness checks, not interchangeable
universal targets. Player-, venue-, competition-, and situation-specific
calibration remains future work.

To reproduce the dataset summaries after obtaining and extracting the licensed
archives outside the repository:

```bash
node scripts/calibration/summarize-data.cjs t20 /path/to/t20-json 2016 2023
node scripts/calibration/dataset-report.cjs t20 /path/to/t20-json 2024 2026
node scripts/calibration/build-benchmark.cjs /path/to/temporary-output
node /path/to/temporary-output/calibration-benchmark.cjs t20 realism 500 20261101
```

Replace `t20` with `odi` or `test` and use the matching archive. The benchmark
uses the webpack already supplied by React Scripts and does not send local game
data to Cricsheet.
