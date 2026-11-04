# Match engine: meaningful settings and fielding impact

**Status:** Proposal only. No engine, state, UI, or gameplay changes are implemented by this document.

## Goal and scope

Make every gameplay setting have a meaningful, explainable effect at the appropriate stage of
a delivery. Batting decisions should interact with the actual bowling plan and current field,
not just contribute unrelated bonuses to a final result.

"Every setting matters" does not mean every setting changes every ball. A deep fielder should
not affect an unrelated bowled dismissal; a keeper should not prevent a clean six. Defaults are
valid neutral choices. Retention changes how long a call lasts, not player ability. Commentary,
sound, and display preferences must remain cosmetic.

Start with the existing controls and field presets. Custom fielder dragging, new player-rating
editors, full ball physics, injuries during play, and a complete cricket-laws overhaul are not
required for the first release. Changes to outcomes must be explicitly versioned and balanced,
while existing selection, save/load, and match progression flows remain intact.

This follows the [live-match gameplay plan](./live-match-gameplay-plan.md): that work introduced
the cockpit and initial modifiers; this proposal makes their interactions deeper and consistent.

## What the current code actually does

The engine is not literally driven by only one batting and one bowling setting. Several inputs
already affect results, but most are flat shifts rather than a connected simulation:

| Surface | Current behavior | Gap to address |
|---|---|---|
| [Outcome model](./utils/controllerOutcomeUtils.js) | Starts with format weights, compares the batter's relevant pace/spin ability with the bowler's dominant skill, and applies pitch, some weather, home-bowling, leadership, outfield, and intent adjustments. | One ability-difference band drives the core matchup; small changes can stay within the same band. There is no delivery execution or contact model. |
| [Batting tactics](./utils/battingTactics.js) | Approach, shot, and all nine targets have modifier definitions, including neutral defaults. There are limited target/line, loft/yorker, and boundary-field interactions. | Target largely gives an unconditional scoring bonus. Shot suitability and actual coverage are not resolved. |
| [Bowling tactics](./utils/bowlingTactics.js) | Plan, preset, line, length, compatible variation, and special delivery affect weights when user bowling is active. | Settings mostly add independently; an intended yorker has no success/miss distinction. |
| [Bowling field map](./components/BowlingFieldMap.js) | Three presets each draw nine named positions stored inside the component. The caption explicitly says positions are approximate, not a legality check. | These positions never reach the outcome model. Only the preset name contributes a generic modifier. |
| [Batting target map](./components/BattingTargetMap.js) | Selects one of nine sectors using its own display geometry. | Does not show the current opposition field; its geometry is not shared with the bowling map. |
| [Delivery controller](./hooks/controller/controllerDeliveryEngine.js) | Passes tactics and user-control flags into the resolver and updates scores, extras, overs, and special credits. | Bowling tactics are passed as effective tactics only during user bowling; batting modifiers only apply during user batting. Normal opposing sides therefore do not receive a complete two-sided tactical matchup. |
| [Control ownership](./hooks/controller/controllerInningsCore.js) | In career mode the user controls their created player, not every teammate's delivery. | AI tactics must exist independently of whether a human currently controls the striker or bowler. |
| [Match conditions](../../gameData/matchCondition.js) | Pitch attributes and outfield `boundaryScoring` feed the resolver; rainy, windy, and stormy weather have adjustments. | `fieldingSafety` and `ballPreservation` are unused there; sunny and cloudy have no distinct resolver adjustment. |
| [Career player attributes](./player-ability-changes.md) | Aggression, fitness, morale, form, and confidence exist alongside core abilities. | The live outcome resolver does not read those attributes. Do not confuse progression effects with per-ball effects. |
| [Ball events](./utils/bowlingBallEventUtils.js) | Store selected tactics and the result, with a recent-history limit of 60 deliveries. | No actual landing area, shot direction, fielder involvement, or explanation of a tactical interaction. |
| [Career fixture simulation](./utils/careerFixtureSimulationUtils.js) | Unattended schedule fixtures use random format score ranges and generated scorecards. | This is a separate path from live delivery simulation; changing the live resolver alone will not make it settings-aware. |

Two technical details also matter when planning:

- Weights are rounded to integer slots out of 100. Dots become the remainder when non-dot weights
  total at most 100; otherwise all weights are scaled. A requested modifier can be diluted,
  rounded away, or overridden. Evaluate the final distribution, not just modifier-table entries.
- Dismissal commentary is selected after a generic `W`, and every wicket currently credits the
  bowler. Fielding dismissals cannot be added safely without structured dismissal attribution.

## Settings-to-effect contract

Use this inventory as the implementation and test checklist. Effects below are proposed, not
claims about current behavior. Each non-default option needs a relevant scenario where it
changes the measured result and a documented tradeoff.

### Batting

| Setting | Intended effect | Tradeoff / interaction |
|---|---|---|
| Approach: `defend`, `balanced`, `attack` | Sets risk appetite and shot commitment; balanced is the reference profile. | Defending favors survival and dots; attacking favors boundaries with more mistiming and dismissal risk. |
| Shot: `leave`, `rotate`, `drive`, `cutPull`, `loft` | Changes contact type, likely height, pace off the bat, and direction spread. | Drive fits fuller balls; cut/pull fits short balls or width. Leave is unsafe against a ball threatening the stumps. Loft trades ground interception for aerial catching risk. |
| Target: `thirdMan`, `point`, `cover`, `midOff`, `straight`, `midOn`, `midWicket`, `squareLeg`, `fineLeg` | Biases the shot-sector distribution, with execution error and adjacent-sector outcomes. | Open lanes improve scoring; covered lanes increase stops or catches. Forcing a target against an unsuitable line/length reduces contact quality. No sector receives a permanent free bonus. |
| `retainShotAndTarget` | Reuses the selected call according to the existing reset rules. | No direct probability modifier. New batters, free-hit transitions, and innings changes must still reset the appropriate choices. |
| Super Shot | Improves attacking execution within the existing ability/credit limits. | Remains probabilistic and can be caught; it must not ignore a well-placed field. |
| Free Hit | Applies the active dismissal restrictions after tactical effects. | First preserve the current no-wicket rule. Introducing real-law exceptions, such as run-outs, requires a separately approved rules change and matching scoring/UI tests. |

### Bowling and fielding

| Setting | Intended effect | Tradeoff / interaction |
|---|---|---|
| Over plan: `balanced`, `attack`, `pressure`, `contain` | Sets the risk/accuracy objective; balanced is the reference profile. | Attack seeks threatening deliveries with more scoring risk; pressure favors dots/rotation denial; contain accepts singles to reduce boundaries. Do not count the same benefit again through the field preset. |
| Line: `outside`, `stumps`, `body` | Controls intended lateral location, accessible shots/sectors, and relevant dismissal opportunities. | Outside creates edges but risks wides; stumps creates bowled/LBW pressure; body restricts room but can feed leg-side scoring. |
| Length: `yorker`, `full`, `good`, `short` | Controls bounce/contact opportunities, conditional on execution. | A successful yorker limits lofting; a missed yorker becomes a hittable full ball or full toss. Short balls offer pull/cut opportunities rather than simply increasing every outcome. |
| Variation: `stock`, `slower`, `cutter`, `flighted`, `quicker` | Alters timing, movement, or bounce within the bowler's supported repertoire. | Slower balls punish early swings; cutters benefit from grip; flight invites attack and mistiming; quicker balls reduce reaction time. Keep pace/spin eligibility and visible stock-delivery fallback. |
| `specialDeliveryArmed` | Adds a bounded execution/deception benefit to the selected delivery. | Keep eligibility, consumption, and one-per-over limits authoritative; do not stack the legacy special intent a second time. |
| Field preset: `balanced`, `attacking`, `boundary` | Selects actual coverage and catching positions used by the engine. | Close catchers offer wicket chances but leave gaps; deep coverage reduces reachable boundaries but yields singles. A clean six beyond reach cannot be stopped merely because the preset is defensive. |
| Current bowler, XI, batting order, keeper, captain/vice-captain | Select the actual participants and applicable skills/roles. | Preserve selection and quota constraints. Keeper affects keeper opportunities; leadership must not become a universal bonus for every fielder. |

### Player, conditions, and match context

| Input | Proposed use |
|---|---|
| `abilityToPlayPaceBall`, `abilityToPlaySpinBall`, `paceAbility`, `spinAbility` | Keep the relevant skill matchup central, but use smooth, bounded adjustments rather than making small improvements disappear within broad bands. Do not apply a player's irrelevant bowling style to every delivery. |
| `battingAggresion` | Existing spelling must remain compatible with saves. Use as a bounded natural attacking tendency/execution profile, not a second copy of the user's approach or an automatic skill increase. |
| Fitness, form, confidence, morale | Where present, modestly affect execution consistency or decision tendencies. Give missing legacy values documented neutral defaults; avoid overlapping multipliers that overwhelm ability or create runaway success/failure loops. |
| Fielding and keeping quality | No such ratings are consumed by the current resolver. Start with documented neutral competence and explicit keeper assignment. Individual catching, ground-fielding, throwing, or keeping ratings are an optional schema extension, not existing data to assume. |
| Pitch: grassy, dusty, dead, sporting, dry | Affect pace movement, spin/grip, and batting contact through existing pitch attributes; condition-by-variation interactions should have bounded coefficients. |
| Weather: sunny, cloudy, rainy, windy, stormy | Give distinct, justified profiles: sunny as baseline, cloudy supporting movement, rain/dew affecting grip, wind affecting aerial spread, stormy increasing execution variability. These are game abstractions, not new rain-delay rules. |
| Outfield: lush green, fast/hard, wet/dewy, dry/patchy | `boundaryScoring` affects ground-ball travel; `fieldingSafety` affects clean pickup/misfield chance; `ballPreservation` affects ball wear only once ball condition is explicitly tracked. Do not use ground speed as an automatic six bonus. |
| Format, overs, innings phase, score, wickets, chase target | Format establishes baseline balance and supported rules. Situation guides AI plans and a small, explicit pressure component, not a hidden forced result. Preserve the existing simplified handling of Test-like formats. |
| Venue and location | Use the venue's selected conditions and document any retained home-advantage modifier. Avoid counting stadium, country, and their derived conditions repeatedly for the same benefit. |
| Toss and bat/bowl decision | Affect innings order and chase context, not a magic probability bonus for the toss winner. |
| Non-striker | Participates in strike rotation and, if running/run-outs are later modeled, running decisions. Do not invent a running-speed rating from unrelated batting ability. |

## Three suggested approaches

| Approach | How it works | Benefits | Costs / limitations |
|---|---|---|---|
| **A. Contextual weighted outcomes** | Keep the existing run/wicket distribution, add explicit interaction tables, and derive sector-level coverage from shared field definitions. Calculate field effects before sampling the final result. | Smallest change; easy to compare with current weights; suitable for an initial field-aware release. | Still approximates contact and dismissals. Interaction tables can grow quickly, and generic wicket weights cannot explain a specific catch accurately. |
| **B. Staged delivery, contact, and field resolution** | Resolve intended versus actual delivery, then batting response/contact, then the relevant fielding opportunity, then scoring and dismissal. | Every setting has a natural place; field positions and shot targets interact directly; produces truthful explanations. | More calibration and structured event/scoring work; requires careful migration and regression tests. |
| **C. Continuous spatial simulation** | Represent ball flight, bounce, fielder reach, and travel time in continuous coordinates. | Highest spatial detail; supports custom placements and richer visual replays later. | Highest complexity and data demand; difficult to balance and validate; likely excessive for the current simulator. |

**Recommendation:** Use B as the target architecture. A is a useful first increment if a smaller
release is needed: share field definitions, fix two-sided context, and prove coverage effects
before adding staged resolution. Reuse those modules in B rather than maintaining two competing
tactical systems. Defer C until gameplay evidence shows that sector-based resolution is insufficient.

## Recommended design

### 1. One effective context for each delivery

Build an immutable snapshot before rolling any outcome:

- Striker, partner, bowler, bowling XI, roles, format/rules, conditions, and match situation.
- Effective batting plan and bowling plan, with their owners identified separately.
- Current field setup, existing special-action eligibility, and active free-hit state.
- Engine version and deterministic random-generator state when supported.

Human-control flags decide who supplies a plan, not whether that side participates in the
simulation. Generate a plan for the AI-controlled side, including career teammates and unattended
innings. Use public match context and visible field coverage; do not let AI inspect the opponent's
unrevealed next-ball selection or the random outcome before choosing.

Never reuse the user's bowling settings as the opponent's field when the user starts batting.
Store or derive plans per side/innings, with explicit reset and ownership rules. Apply normal
legacy intent mappings once; special actions remain separate, validated overlays.

### 2. Make the displayed field the simulated field

Move the preset definitions out of `BowlingFieldMap.js` into a shared field-model utility.
Represent each of the nine outfield positions with a stable position ID, named sector, depth
(close, ring, or boundary), and coverage/catching characteristics. Add bowler and keeper roles
explicitly rather than counting them among the nine outfielders.

Do not treat current SVG pixels as real metres. The two maps use different viewports and
orientations. Define one canonical sector convention, verify every named position against it,
and derive both visual layouts and simulation coverage from that convention. Keep handedness
neutral initially, as the current batting UI describes; handedness support needs explicit data
and tested mirroring later.

For each ball, use the actual shot sector, height, speed, and depth to identify eligible fielders.
Limit overlapping coverage so nine stacked positions cannot create nine independent full-strength
bonuses. Field away from the ball should have little or no effect.

Examples of expected behavior:

- Drive through an uncovered cover sector: more boundaries than the same drive into cover coverage.
- Move cover deeper: fewer fours, but more easy singles and fewer close catches.
- Add slip for an edge from an outside delivery: increased catching opportunity, not extra
  bowled/LBW probability.
- Loft toward long-on: catch chance only if trajectory and distance put the ball within reach.
- Wet or patchy ground: changed pickup reliability and ground-ball travel, not guaranteed errors.

Initially use neutral fielder competence; if identities are assigned, exclude the current bowler
and keeper from outfield slots and revalidate after substitutions or bowler changes. Validate nine
unique outfield slots plus the two fixed roles. Existing diagrams are not legal-field guarantees:
do not label them powerplay-compliant without adding explicit format/phase restriction data and
validating the presets. Official field restrictions are a separate rules milestone.

Show this same effective field on the batting target map, including a text description of covered
lanes. A batter must be able to see the field that will actually be used for the next ball.

### 3. Resolve the ball in stages

1. **Delivery execution:** Line, length, variation, bowler skill, plan, and conditions determine
   the actual delivery and whether it is illegal. Intent is not guaranteed execution.
2. **Batting response:** Approach, shot, target, relevant batting ability, and actual delivery
   determine miss/edge/controlled contact, trajectory class, and sector spread.
3. **Dismissal opportunities:** Misses can threaten the stumps; edges and aerial contact can
   create catches. Keeper-only opportunities use the keeper. A wicket is not rolled independently
   again at every stage; resolve mutually compatible branches with at most one dismissal.
4. **Field resolution:** Relevant coverage and outfield conditions decide interception, pickup,
   catch/drop, or escape. Begin with stops and catches; defer throws/run-outs until their scoring
   contract is implemented.
5. **Scoring and rules:** Produce one authoritative result with runs, extras, legality, dismissal
   type/credit, and strike changes. The controller applies it once and updates counters.

Keep probability construction pure and separate from sampling. Prefer normalized floating-point
probabilities over repeated integer rounding. Bound modifiers and normalize each conditional
distribution; encode impossible outcomes as zero. Never multiply unrelated bonuses without a cap.
For approach A, compute coverage-adjusted final weights before sampling, not a second random
"fielding correction" that may contradict the sampled score.

Outfield `ballPreservation` needs a small, explicit ball-condition state to become meaningful:
define starting condition, wear per delivery, and its limited effect on movement/grip. Derive
elapsed deliveries from authoritative state, not the truncated 60-ball tracker, and persist the
condition. No reverse-swing/new-ball system is required for this first abstraction.

### 4. Explain results without inventing causes

Extend delivery events with intended/actual line and length, actual shot sector, contact class,
field snapshot/version, involved position or fielder, dismissal attribution, and a small set of
reason codes. Preserve existing result fields and old commentary compatibility.

Examples: "Deep cover cut off the drive; one run" or "Loft mistimed against the slower ball;
long-on held the catch." Generate these only when the corresponding stages actually occurred.
For approach A, say "Cover was well protected" rather than inventing a named catch from a generic
wicket token. Optional probability comparisons describe changed odds, not certainty about why
a random outcome happened.

## Implementation sequence for a future change

1. **Characterize the existing engine before editing it.** Run relevant existing tests and add
   final-distribution fixtures for neutral defaults, each setting, specials, and both innings.
   Record baseline scoring/wicket rates by format and ability matchup.
2. **Write failing contract tests, then unify context and field data.** Cover both AI and human
   plans, stale-opponent-settings isolation, shared sector mapping, preset coverage, and display
   parity. Keep pure helpers under `utils/`, orchestration in controllers, and state updates in
   the Redux slice. Keep authored code/test/style files at 500 lines or fewer.
3. **Deliver the field-aware increment.** Implement A's bounded interactions or go directly to
   B's first stages. Replace generic field bonuses with coverage-derived effects; do not keep
   both. Keep current presets and controls, with no custom-position editor required.
4. **Complete staged resolution and unused-input coverage.** Add execution, contact, structured
   catches, condition effects, and ball wear with tests first. Add explicit scorecard attribution
   before fielding dismissals ship. Optional individual fielding ratings come later; placement
   must already matter without them.
5. **Wire every runtime path.** Manual balls and live over/full-match auto-play must call the same
   resolver. Adapt unattended career fixtures to a headless version of that pipeline with defined
   match conditions and AI plans, preserving result/scorecard/progression contracts. Benchmark
   season simulation; do not claim parity while it still draws unrelated random totals.
6. **Version, migrate, and balance.** Persist engine version, per-side plans, field state, ball
   condition, and random state through the existing save service. Keep older event records
   readable. Pin in-progress legacy matches to legacy behavior or require an explicit upgrade at
   a safe boundary; never silently change their engine on load. Document neutral defaults and
   surface invalid-state recovery instead of silently substituting arbitrary fields.
7. **Release behind an explicit version/opt-in gate.** Compare old/new distributions, then update
   gameplay help and this plan's status only after acceptance criteria pass. No Firebase access
   belongs in probability helpers or UI components; retain the existing service boundary.

## Test and balancing plan

Extend the existing tactic, outcome, delivery, Redux, persistence, and component suites rather
than testing only new helpers:

- `utils/battingTactics.test.js`, `utils/bowlingTactics.test.js`,
  `utils/battingOutcomeTactics.test.js`, and `utils/controllerOutcomeUtils.test.js`.
- `hooks/controller/controllerDeliveryEngine.test.js`, `controllerDeliveryEngineOvers.test.js`,
  `controllerDeliveryEngineScoring.test.js`, and `controllerTossAndSimulation.test.js`.
- `gameSlice.test.js`, `hooks/controller/controllerPersistence.test.js`, the two tactics-panel
  suites, and `utils/controllerCareerFixtureSimulation.test.js`.

Add focused shared-field and staged-resolution suites as those modules are introduced.

| Test group | Required evidence |
|---|---|
| Every control | Parameterize all enum values from the exported option lists. Each non-default value changes final probabilities in at least one relevant fixture; neutral defaults are stable. Retention changes call lifetime only. |
| Interactions | Compare drive/full versus drive/short, cut-pull/short versus cut-pull/yorker, loft/successful-yorker, variation/pitch, and target/covered-versus-open lane. Expected effects survive normalization. |
| Field locality | Moving coverage changes the relevant sector more than unrelated sectors. Close catchers do not raise bowled probability; unreachable sixes cannot be stopped. Both maps use the exact setup supplied to resolution. |
| Ownership and modes | Both sides' effective tactics apply in each innings, regardless of user flags. Career player control, AI teammates, auto-play, and headless fixtures do not leak stale user plans. |
| Probability safety | All probabilities finite and nonnegative; each conditional distribution sums to 1 within `1e-9`; no impossible events or double-counted wickets; ability extremes and aggressive combinations remain valid. |
| Scoring rules | Extras/legal balls, free hits, strike rotation, over limits, special credits, replacement players, innings end, and chase completion retain their specified behavior. New dismissal types have correct bowler/fielder credit. |
| Save/load | Old saves migrate predictably; new saves restore pending tactics and field state. With the new seeded engine, saving/loading at a delivery boundary produces the same subsequent outcomes as uninterrupted play. |
| Feedback | Displayed selections, resolved snapshots, history, and commentary agree; unsupported variations and invalid fields produce visible explanations. |

**Suggested initial calibration gates, to be tuned deliberately rather than treated as cricket
facts:** Use exact distribution tests first. In a representative matched-skill fixture, target
at least a 1 percentage-point change in the relevant dot/boundary probability for a tactical
choice, and 0.25 points for a wicket-focused interaction. Test contextual effects where they
should apply, not on unrelated balls. Neutral new-engine fixtures should initially stay within
5% of legacy expected runs per legal ball and 1 percentage point of wicket probability, unless
an intentional rebalance is documented. Specialized attacking/defensive plans may exceed those
neutral-baseline tolerances, but must exhibit their advertised downside.

Supplement exact tests with seeded batches, initially 100,000 deliveries per calibration
scenario, covering pace/spin, low/medium/high abilities, all presets, conditions, and formats.
Report confidence intervals and increase samples where they cannot distinguish the intended
effect. Also simulate full innings to detect runaway plans, excessive extras, or broken chase
behavior; do not balance solely against a single random match.

For future implementation validation, use `npm test -- --watchAll=false --runInBand` with the
relevant test paths, followed by `npm run build`. The current `package.json` does **not** define
`format`, `lint`, or `test:coverage` scripts or per-file coverage thresholds. Record that tooling
gap before implementation; do not claim those checks pass or add tooling as part of this document.

## Definition of done for the proposed engine

Every gameplay input above is either exercised by a relevant measured test or explicitly scoped
as a lifecycle rule, neutral default, or deferred schema/rules extension. Field presets affect
the sectors and opportunities they actually cover, and the visible field matches the resolver.
Both teams use the same rules without hidden user/AI advantages. Existing match flows and saves
remain supported, while new results explain actual events rather than decorative selections.
