# Bowling-only live gameplay plan

**Status:** First playable bowling cockpit implemented. This document remains the design
contract and roadmap for balancing and future spatial-fielding work. It expands the bowling portion of the
[live match gameplay plan](./live-match-gameplay-plan.md).

## Current implementation status

- The live bowling view shows match pressure, current bowler figures/quota, batter matchup,
  over plan, field preset, pitch call, compatible variation, special-delivery credits, and the
  current-over tracker.
- Plans, field presets, line/length, variations, and armed special deliveries are saved with game
  state. Legacy Normal / Wicket Ball / Save Run saves map to Balanced / Attack / Protect
  Boundaries. Legacy Special Bowl saves do not auto-arm a delivery.
- Bowling plans and calls now change the normalized outcome distribution for user-controlled
  bowling. Special Bowl remains resource-limited and is consumed as one explicit delivery.
- The field graphic shows an approximate preset and its outcome modifiers are abstract. The
  simulator still does not model individual fielder positions, ball trajectories, or fielding
  legality. Batting handedness is also not represented, so line controls use general channel
  labels rather than claiming precise batter-relative off/leg geometry.
- Balance the initial modifiers with longer seeded scenarios before treating them as final game
  tuning.

## Goal and scope

Give the user meaningful bowling decisions beyond selecting one intent button. The player should
be able to set a bowling strategy, shape the field, call a delivery, and understand the match
situation that makes each choice useful.

This plan covers only the user-controlled bowling experience:

- Match and batter context needed to make a bowling decision.
- Over-level strategy and field presets.
- Per-delivery line, length, and supported variation.
- Special-delivery eligibility and resource feedback.
- Delivery result, over tracking, and the connection between a bowling choice and the outcome.
- Save compatibility, testing, balance, and staged implementation.

The batting player's control system is out of scope. The batting side is shown as context, and
the bowling model must still account for its players' abilities. The visual reference supplied
with the request is a functional reference for showing score, active bowler, batter matchups,
field space, and ball history. Make original visuals using the existing theme; do not copy the
reference artwork or reproduce its screen.

## Current bowling experience

### Current interaction flow

1. When the user's side is bowling, [InningsStage.js](./components/InningsStage.js) shows a
   **Bowling Intent** group.
2. The group is built from `bowlingActionList` in
   [simulatorUtils.js](../../utils/simulatorUtils.js): Normal, Wicket Ball, Save Run, Special
   Bowl.
3. Clicking an action updates the single `bowlingIntent` field through `setBowlingIntent`.
4. On **Play Next Ball**, [controllerDeliveryEngine.js](./hooks/controller/controllerDeliveryEngine.js)
   passes the selected intent to [controllerOutcomeUtils.js](./utils/controllerOutcomeUtils.js).
   The selected intent remains active for the user's subsequent deliveries until the user
   chooses another intent or the Special Bowl eligibility check resets it.
5. At an over boundary or bowler quota limit, the existing rules may require a new bowler. The
   user selects an eligible bowler before the next delivery.

The action group offers **one** choice at a time. It does not let the user call line, length,
field placement, or an ordinary pace/spin variation. The user can see the current bowler and
score context, but does not get a single, consolidated bowling decision view.

### What each current intent actually does

`resolveOutcome` starts with format-specific outcome weights, applies player, pitch, weather,
outfield, and intent adjustments, then normalizes the results to a 100-point distribution.
The values below are **raw weight changes before normalization**, not guaranteed percentage-point
changes. Their final probabilities vary with format, player abilities, and match conditions.
`0` means dot ball; `W` means wicket; `WD` and `NB` mean wide and no-ball.

| Current action | Raw changes to outcome weights (`0, 1, 2, 3, 4, 6, W, WD, NB`) | What it means in practice |
|---|---|---|
| **Normal** | No intent-specific change | Uses the probability profile from the bowler/batter abilities, pitch, weather, outfield, and format. |
| **Wicket Ball** (`tryForWicket`) | `-15, +4, +2, +1, +4, +1, +3, 0, 0` | Increases wicket weight, but also increases every scoring outcome, including fours. It is an aggressive, high-variance call, not a pure wicket-only action. |
| **Save Run** (`saveRun`) | `+20, -8, -3, -1, -4, -2, -2, 0, 0` | Strongly favors dots and reduces scoring, while also reducing wicket weight. It is a run-control call with less wicket threat. |
| **Special Bowl** (`specialBowl`) | `-4, -5, -2, -1, +2, +1, +7, +1, +1` | Raises wicket weight substantially but also raises boundary, wide, and no-ball weights. This has a real risk/reward cost. |

These are not direct outcome guarantees. For example, “Wicket Ball” can still be hit for a
boundary; “Save Run” can still concede runs; and a Special Bowl can still miss.

### Current Special Bowl rules

The current special action:

- Requires the current bowler to have pace or spin ability above 70.
- Is limited to one special ball in an over.
- Uses `3 + specialBallBonus - specialBallUsedMatch` as the remaining-credit calculation.
- Earns one `specialBallBonus` credit when the user-controlled bowling side takes a wicket.
- Counts use on a wicket, run, wide, or no-ball delivery.
- Is disabled in the view model when unavailable, with the reason shown beside the action.

The counters live inside innings state. In particular, `specialBallUsedMatch` is nested in an
innings object that is rebuilt at innings setup, so its effective scope is currently an innings
despite the field name saying “Match.” Decide explicitly whether the new game should use a
per-innings or match-wide allowance before changing the displayed quota.

One UX risk is that Special Bowl is represented by the same persistent intent field as Normal,
Wicket Ball, and Save Run. In the new model it must become an explicit one-delivery action, not an
over plan that can be consumed again after every eligible over boundary.

### Current core-information gaps

| Information | Current experience | Gap for bowling decisions |
|---|---|---|
| Match situation | Score, wickets, and overs appear in the innings header. A chase shows a target. | Required run rate / runs and legal balls remaining are not assembled into a bowling decision summary. |
| Batters | Striker and non-striker names are shown. Batting skills are used by the outcome engine. | Current batter runs/balls and matchup summary are not prominent beside the bowling controls. Batting handedness is not present in the inspected roster/game model, so off/leg-relative labels need a data decision. |
| Bowler | Current bowler name is shown; the scoreboard derives overs, runs, economy, and wickets. A bowler is selected when required by over rules. | The live control area does not summarize figures, overs remaining under quota, or the special-credit count. There is no separate fatigue/stamina model; fitness must not be relabeled as stamina. |
| Bowling tactics | One selected intent changes the outcome weights. | No line, length, variation, or field-placement input is represented in state or passed to the outcome engine. |
| Field | Pitch and outfield conditions influence outcome weights. | No field preset, fielder positions, or ball-direction/shot-zone result is tracked. A field diagram must not imply precise fielding simulation until those inputs/results exist. |
| Ball feedback | Recent commentary is shown. | No dedicated six-ball over tracker shows legal balls, extras, and the tactical call that was used. |
| Special resource | Special Bowl is enabled/disabled with a generic reason. | Remaining credits, over use, and what earns a credit are not clearly presented together. |

## New bowling experience

### Core decision model

Separate a team strategy from the ball-by-ball call. These are different decisions and should
not be collapsed into a long list of competing buttons.

#### Over plan: one strategic profile

The over plan expresses what the bowling side is trying to do. It is selected at the start of
an over and remains visible until changed.

| Plan | User-facing purpose | Intended trade-off |
|---|---|---|
| **Balanced** (default) | Use the bowler's standard plan. | No plan-specific bonus or penalty; preserves the current Normal baseline. |
| **Attack** | Prioritize a wicket or a mistake. | More wicket pressure, with a meaningful chance of boundaries and/or extras if the line or length misses. |
| **Pressure** | Build dots and make rotation difficult. | More dot-ball and controlled-single outcomes, without the boundary leakage of an all-out attack. |
| **Protect Boundaries** | Keep the ball out of scoring areas and defend a total. | Lower boundary risk, accept some singles, and reduce wicket pressure relative to Attack. |

The names and effects are a proposed product contract, not calibrated numbers. Tune the
probability model with tests and simulations before shipping.

#### Field preset: one over-level layout

Keep field presets separate from over plan, since a captain may attack with a different field
or defend a boundary while still bowling at the stumps.

| Preset | On-screen explanation | Initial gameplay role |
|---|---|---|
| **Attacking** | More close catching positions; more space at the rope. | Support wicket-taking; a miss may leak boundaries. |
| **Balanced** | Standard spread around the field. | Baseline coverage. |
| **Boundary protection** | More boundary riders; fewer close catchers. | Limit fours/sixes; make singles and strike rotation more likely. |

Do not claim that individual fielders make catches or stop balls in specific locations until
the engine models fielder positions and a delivery/shot sector. The first field view should
accurately show the selected preset and its intended coverage. Any outcome effect before
spatial simulation should be an explicitly abstract preset modifier.

#### Delivery call: line, length, and supported variation

These are the user's call for the next ball. Provide a small pitch target map and equivalent
labeled controls. A called target is strategic intent, not a guarantee of exact execution.

| Dimension | Proposed choices | Notes |
|---|---|---|
| **Line** | Outside-off channel / at the stumps / leg-side channel | If choices are described as off-side or leg-side from the batter's perspective, first add and hydrate batting-hand data. Until then use unambiguous pitch/channel labels. |
| **Length** | Yorker / full / good / short | Only the categories the outcome model can distinguish should be shown as meaningful tactical choices. |
| **Variation** | Stock / one supported change-up | Make availability depend on bowling style and any modeled skill/resource. Do not invent a separate variation rating from the current pace/spin number without balancing evidence. |

Use the bowler's existing pace/spin abilities to choose compatible options only where that
mapping is well-defined. A pace bowler should not receive a spin-only call, and a spin bowler
should not receive a pace-only call. If no compatible metadata is available, show Stock only
and explain why.

For speed of play, line/length/variation may visibly retain the last call with a **Repeat last
delivery** affordance. A user must be able to confirm the repeated call rather than unknowingly
carrying a stale target to a new batter or new bowler. A Quick Plan should provide one-tap
defaults when the user does not want to make a detailed call.

#### Special delivery: explicit, limited action

Keep the current Special Bowl identity as a separate **Use special delivery** control, not an
over plan. The user must deliberately arm it for the next legal delivery. Show:

- Whether the current bowler meets the capability requirement.
- Remaining special credits and the per-over limit.
- A concise explanation of the potential benefit and cost (wicket pressure versus scoring,
  wide, and no-ball risk).
- Clear armed/consumed/expired states.

On selection, validate eligibility again in the delivery engine, consume at most once, record the
call in the ball event, and disarm it after the attempt regardless of the result. If the
special is unavailable, the ordinary delivery still works. Preserve the existing
`specialBallBonus` credit rule unless a separately tested rule change is approved.

### Recommended interaction cadence

| Choice | Cadence | Why |
|---|---|---|
| Over plan | Start of over; editable during the over | Gives an understandable team objective without repeated setup. |
| Field preset | Start of over; editable during the over | Field placement is a captain/over decision. |
| Line and length | Next delivery | This is the direct ball call and can respond to the batter/current situation. |
| Variation | Next delivery, optional | Keeps stock bowling fast and makes a change-up an intentional tactical choice. |
| Special delivery | Explicitly arm for one delivery | Avoids accidentally consuming special credits because an old intent remained selected. |

When an over ends, retain the field/plan for the next over as a starting point, but visibly
prompt the captain to review them and the bowler. When the bowler changes, reset a
bowler-specific variation to Stock and ask for confirmation of any incompatible pending call.
Do not force the user to revisit every selector if the chosen plan is still valid.

### Bowling screen information architecture

Adapt the reference's useful information hierarchy to this project's own layout. The bowling
view should surface these data before **Play Next Ball**:

1. **Match situation strip**
   - Format, innings, score/wickets, over and legal balls.
   - On a chase: target, runs remaining, legal balls/overs remaining, current rate, and required
     rate.
   - Weather, pitch, and outfield as secondary context.
2. **Active bowler card**
   - Name, bowling style/role, selected plan, current figures, overs bowled, and remaining
     quota.
   - Special-delivery credits and whether one has been used this over.
   - Do not show “stamina” unless a fatigue model is added; fitness is a separate rating.
3. **Batter matchup card**
   - Striker and non-striker, runs/balls, wickets in hand, and partnership if available.
   - Show relevant pace/spin batting ability against the active bowler type as a compact
     comparison; do not turn hidden formula inputs into misleading exact win odds.
   - Add batting hand before presenting batter-relative off/leg calls.
4. **Over plan and field**
   - Selected plan and field preset, using labels and a simple original top-down diagram.
   - Provide standard buttons/selectors alongside map interaction for keyboard and assistive
     technology.
5. **Next-ball call**
   - Visible line, length, and optional variation, with “Repeat last delivery” and Stock reset.
   - State that the pitch-map marker is the intended target, not a measured ball trajectory.
6. **Over tracker and result**
   - Six legal-ball slots, with extras marked separately (for example `WD +1` or `NB +1`).
   - Show over total and recent wickets/boundaries in text as well as color/symbols.
   - After delivery, show the call, result, score consequence, and a short factual explanation.
     Do not attribute a wicket to a field position unless the spatial model returned that cause.
7. **Primary action**
   - A single prominent **Play Next Ball** button.
   - Save, scoreboard, simulate over, and simulate match remain secondary and retain existing
     eligibility/visibility rules.

On phones, stack these groups in that order. Keep the score, active bowler, next-ball call, and
Play Next Ball near the top. Put the full scorecard and older commentary in expandable
secondary content, avoid horizontal scrolling, and preserve the dashboard's fixed mobile
navigation inset.

### How the new plan changes core gameplay information

| Core information | Current bowling view | Bowling-plan view | Gameplay change |
|---|---|---|---|
| **Situation** | Score/overs in the header; target on the chase. | Adds runs/balls remaining, required rate, wickets, and current over context. | User can choose between wicket pressure and boundary prevention based on the actual state, not only a generic intent. |
| **Active bowler** | Name and scoreboard figures elsewhere. | Bowler card puts figures, current spell, quota remaining, and special credits beside controls. | Over-limit and resource decisions become understandable before a delivery. |
| **Opponent batters** | Names are visible; abilities influence the engine. | Current runs/balls, striker/non-striker, and relevant matchup appear together. | The same plan can be adapted to a new striker or a batter who is set. |
| **Strategic intent** | One persistent action: Normal, Wicket Ball, Save Run, or Special Bowl. | Over plan (Balanced/Attack/Pressure/Protect Boundaries) plus field preset. | Team objective and field coverage become independent decisions; current intents are mapped rather than simply renamed. |
| **Delivery execution** | No line/length/variation input. | A per-ball pitch call with compatible variations. | The user can target a batter/zone and accept an execution risk; outcomes still remain probabilistic. |
| **Field** | No field placement state or fielder locations. | A selected preset is visible and affects a documented, bounded scoring model. | Field setting becomes a tactical choice; individual fielder/catch outcomes are deferred until spatial state exists. |
| **Special resource** | Special Bowl may be disabled with a reason; credit count is not prominent. | Explicit one-ball action with remaining-credit and over-use feedback. | A rare action is deliberate and cannot repeat merely because a saved intent stayed active. |
| **Recent over** | Commentary is the main delivery history. | Six-ball tracker separates legal balls from wides/no-balls and shows the call/result. | The user can evaluate the plan and manage the over without reconstructing it from prose. |
| **Feedback** | Commentary describes an outcome. | Call, result, score impact, and verified tactical consequence are shown together. | Gameplay teaches trade-offs while avoiding false claims about unmodeled trajectories or fielders. |

## State and migration proposal

Keep `bowlingIntent` during an initial transition so existing controllers and saved games remain
readable. Add a validated bowling tactical state to the game and pass an immutable snapshot into
`processDelivery` and `resolveOutcome`.

```js
bowlingTactics: {
  overPlan: 'balanced',
  fieldPreset: 'balanced',
  nextDelivery: {
    line: 'stumps',
    length: 'good',
    variation: 'stock',
  },
  useSpecialDelivery: false,
}
```

Final names and reset cadence should be confirmed before coding. Recommended lifecycle:

- `overPlan` and `fieldPreset` remain until changed; they are reviewed at over end.
- `nextDelivery` is a visible pending call; after a ball, the UI clearly indicates whether it is
  repeating or has reset to Stock/Good/Stumps.
- `useSpecialDelivery` is one-shot. It is validated at arm time and again when resolving the
  ball, then cleared.
- New innings and a match reset clear pending delivery/special state and restore Balanced /
  Balanced defaults.
- Old saves with only `bowlingIntent` load to safe defaults and a one-time migration mapping:
  - Normal -> Balanced plan.
  - Wicket Ball -> Attack plan.
  - Save Run -> Protect Boundaries plan.
  - Special Bowl -> never auto-consume on hydration; show a safe pending prompt only if the
    old snapshot is eligible, otherwise fall back to Stock and explain the reset.
- Do not silently drop `specialBallUsedInOver`, `specialBallUsedMatch`, or
  `specialBallBonus` when hydrating old innings state.
- Decide whether Special Bowl quota is per innings or per whole match. Current counters are
  stored in innings state and reset with a new innings; UI copy and tests must reflect the
  chosen scope.

## Outcome-model contract

### Required effects

The new choices must affect a bounded outcome model, not act as decorative toggles:

- **Plan** controls the overall risk profile: wicket pressure, dots/rotation, and boundary
  exposure.
- **Line** and **length** affect the matchup with the active striker and delivery execution.
- **Variation** has a plausible benefit/cost (for example deception versus control/extra risk)
  and is limited to compatible bowlers.
- **Field preset** affects scoring protection only to the extent represented by a spatial or
  explicitly abstract field model.
- Existing bowler/batter ability, pitch, weather, outfield, and format remain important parts of
  the resolution.
- Outcome weights must be clamped and normalized. A call changes chances; it must not guarantee
  a dot, wicket, or boundary.

### Spatial-model boundary

The current outcome result is a run/wicket/extra token. It does not include shot direction,
delivery coordinates, or fielder positions. Therefore:

1. In the first balance pass, implement plan/line/length modifiers in the existing probability
   model and clearly label field presets as abstract coverage profiles.
2. If individual field positions are required, add a separate categorical zone/trajectory
   result and fielder placement data before claiming a specific fielder stopped/caught a ball.
3. Keep the original result token (`0`, `1`, `2`, `3`, `4`, `6`, `wide`, `nb`, `W`) and existing
   score/strike/over rules authoritative.
4. Do not show exact probability percentages until deterministic evaluation proves they are
   calibrated and interpretable.

## Phased implementation

### Phase 1 — Baseline and rules contract

- Add characterization tests for Normal, Wicket Ball, Save Run, and Special Bowl raw weight
  effects across at least T20 and Test baselines.
- Decide and document the Special Bowl quota scope, credit award, reset cadence, and
  one-shot activation behavior.
- Define valid plan/field/line/length/variation enums and defaults.
- Decide whether batting-hand data is added before showing batter-relative off/leg labels.
- Keep this phase behavior-preserving; do not change the existing action effects yet.

### Phase 2 — Bowling cockpit UI, no engine changes

- Split bowling controls from [InningsStage.js](./components/InningsStage.js) into focused
  components under the project's per-file line limit.
- Show match situation, active bowler figures/quota, batter matchup, current over, current
  intent, and special-credit count using existing state only.
- Add visible over-plan, field, and delivery-call selectors behind a temporary legacy mapping.
- Keep **Play Next Ball**, save/load, full scoreboard, simulate-over/match, next-bowler selection,
  and batting controls unchanged.
- Test desktop/tablet/mobile layouts, keyboard controls, status/disabled reasons, and reduced
  motion.

### Phase 3 — Plan and field preset effects

- Add state/default/hydration/reset logic in [gameState.js](./gameState.js) and
  [gameSlice.js](./gameSlice.js).
- Map legacy Normal/Wicket Ball/Save Run to Balanced/Attack/Protect Boundaries.
- Add Pressure as a new profile only after its intended odds are specified.
- Make field presets change only the modeled coverage outcomes; no false fielder simulation.
- Use deterministic tests to assert the intended direction of dot, boundary, and wicket changes
  and verify normalized outcome weights.

### Phase 4 — Line, length, variation, and special action

- Extend [controllerInningsViewModel.js](./hooks/controller/controllerInningsViewModel.js) with
  compatible options and clear reasons when a call is unavailable.
- Pass the per-ball call to [controllerDeliveryEngine.js](./hooks/controller/controllerDeliveryEngine.js)
  and [controllerOutcomeUtils.js](./utils/controllerOutcomeUtils.js).
- Implement Stock first, then add only variations supported by verified player data.
- Convert Special Bowl into an explicit one-ball resource action. Validate/consume it exactly once
  and test no-ball, wide, wicket, normal-run, over-end, bowler-change, and save/load cases.

### Phase 5 — Over tracker and truthful delivery feedback

- Add structured delivery events to innings state with over/ball, legal-ball flag, runs/extras,
  wicket, active bowler, selected call, and outcome token.
- Preserve the current commentary array for saves and existing callers.
- Render the current over and recent history with text labels; retain scorecard modal for full
  innings detail.
- State only what the simulation knows. Do not describe a catch at slip or a ball through
  cover unless the engine models those facts.

### Phase 6 — Balance and release

- Run seeded scenario simulations across formats, bowler types, batter strengths, conditions,
  chase states, and field presets.
- Compare against current outcome distributions. Reject plans that dominate the old controls,
  make wickets deterministic, or make defensive bowling eliminate scoring.
- Confirm AI-controlled bowling remains autonomous and never displays user-only controls.
- Update Gameplay Controls in [README.md](../../../README.md) only after labels/rules are stable.

## Focused test plan

- **Current-action baseline:** In
  [controllerOutcomeUtils.test.js](./utils/controllerOutcomeUtils.test.js), assert existing
  raw shifts and post-normalization invariants before changing the model.
- **View model:** In
  [controllerInningsViewModel.test.js](./hooks/controller/controllerInningsViewModel.test.js),
  test supported pace/spin calls, batter context, Special Bowl eligibility, quota text, and
  safe defaults.
- **Delivery engine:** In
  [controllerDeliveryEngine.test.js](./hooks/controller/controllerDeliveryEngine.test.js) and
  [controllerDeliveryEngineOvers.test.js](./hooks/controller/controllerDeliveryEngineOvers.test.js),
  test one-shot special use, credit changes, over boundaries, bowler changes, and preserving
  score/strike/free-hit behavior.
- **UI:** In [InningsStage.test.js](./components/InningsStage.test.js) and
  [LiveMatchStages.test.js](./components/LiveMatchStages.test.js), test bowling plan selection,
  field preset, line/length, unsupported variation, visible resource counts, active bowler
  selection, current-over tracker, and the primary delivery action.
- **State/save compatibility:** In [gameSlice.test.js](./gameSlice.test.js), test defaults,
  reset, current snapshot hydration, and old saves with only `bowlingIntent`.
- **Scenario/balance:** Use seeded simulation tests to compare outcomes for equal players under
  each plan. Assert relative trends and normalization, not brittle exact long-run counts.
- **Regression:** Keep batting intent, special batting actions, scorecard, save/load, Auto Play,
  and match-end tests passing.

## Acceptance criteria

- Bowling is a sequence of understandable strategic and delivery decisions, not only one of four
  persistent intent buttons.
- Current action mappings and their actual probability effects are documented and tested.
- The user sees the score/target context, active bowler's figures and quota, batter matchup,
  selected plan/field, pending call, and special resources before delivery.
- A Quick Plan and Stock default let the user bowl without navigating many controls.
- Line/length/variation calls affect outcomes in tested, bounded ways; field presets affect only
  outcomes the model actually represents.
- Special Bowl is one-shot, available only when eligible, and never repeats silently after a save
  or bowler/over transition.
- Old saves load and continue without losing the innings or silently consuming a special action.
- Mobile bowling controls fit 375px without horizontal scrolling; all critical controls are
  keyboard and screen-reader operable with clear labels and 44px+ targets.

## Out of scope for this bowling-only plan

- Reworking batting approach, shot selection, running, or batting-order strategy.
- Copying another game's exact UI, art, or wording.
- Individual fielder animation or precise ball-trajectory simulation before the underlying
  spatial model exists.
- Introducing stamina/fatigue, fielding skill, bowling-variation skill, batting handedness, or
  fielding-restriction rules without a separate data/rules design and balance tests.
