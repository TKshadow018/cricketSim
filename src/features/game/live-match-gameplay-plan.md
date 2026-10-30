# Live match gameplay upgrade plan

**Status:** Implemented as the first playable batting-and-bowling cockpit. The current controls,
legacy-save migration, probability modifiers, and delivery tracker are described below.

For the proposed next engine iteration, see
[Match engine: meaningful settings and fielding impact](./match-engine-settings-impact-plan.md).
It compares three approaches for connecting all gameplay settings to two-sided tactical
interactions and the displayed field. That proposal is documentation only, not implemented.

## Goal

Replace the current intent-button-only match experience with a more tactical live-match
cockpit. The supplied reference image is useful for its separation of match context, score,
current players, field view, and ball history. Use those functional ideas without copying its
artwork, exact layout, or visual skin; the implementation should remain original and use the
simulator's existing stadium-inspired design system.

The batting and bowling choices must have visible, testable effects on the outcome engine.
The interface should still let players deliver a ball quickly without requiring a long sequence
of controls on every delivery.

## Current implementation

- [InningsStage.js](./components/InningsStage.js) renders the player strip, one batting- or
  bowling-intent button group, delivery/save actions, commentary, and scoreboard modal.
- [LiveMatchStages.js](./components/LiveMatchStages.js) mounts that innings component for both
  innings and supplies the current score and view-model data.
- [controllerInningsViewModel.js](./hooks/controller/controllerInningsViewModel.js) builds
  action availability, bowler and batter choices, and scorecard rows.
- [controllerDeliveryEngine.js](./hooks/controller/controllerDeliveryEngine.js) advances a
  delivery, updates innings state, and handles wickets, extras, overs, and special-action
  counters.
- [controllerOutcomeUtils.js](./utils/controllerOutcomeUtils.js) adjusts a probability-weighted
  outcome table using player skill, match conditions, and the selected intents.
- [gameState.js](./gameState.js) stores the current batting and bowling intents. Save/load stores
  the game state object through
  [controllerPersistence.js](./hooks/controller/controllerPersistence.js).
- [simulatorUtils.js](../../utils/simulatorUtils.js) defines the current Defend / Normal / Hit Big
  / Super Shot / Free Hit and Normal / Wicket Ball / Save Run / Special Bowl actions.

The screenshot suggests a richer live information hierarchy, but this application already has
scoreboard, commentary, player selection, and special-delivery systems. The upgrade should
compose and extend those systems rather than replace them.

## Product and gameplay principles

1. **One obvious next action:** Keep delivery as the primary action. Tactics are configured
   before it, not interspersed with multiple confirmation dialogs.
2. **Fast by default, detailed when wanted:** Provide quick plans and sensible defaults, with
   advanced shot, line, length, and field controls available without forcing them every ball.
3. **Decisions have consequences:** Show the selected plan and a concise reason/result after the
   ball. Tactical options must affect the outcome model, not just change decoration.
4. **Respect cricket constraints:** Bowler eligibility, over limits, free hits, special-ball
   limits, striker rotation, innings limits, and chase targets remain authoritative.
5. **Readability before spectacle:** Use the existing semantic surfaces and brand tokens.
   Avoid reducing the live score or controls to fit decorative graphics.
6. **Accessible alternatives:** Every field-map target and drag interaction must have a labeled,
   keyboard-operable control. Do not rely on color or a visual diagram alone.
7. **No imitation assets:** Draw any field or pitch visualization as original SVG/CSS using
   project styles; do not reproduce the reference game's player art, icons, or exact visual
   composition.

## Proposed live-match cockpit

### Match status header

Keep a compact, persistent match strip above the decision area:

- Teams, match format, innings, score/wickets, and overs.
- For a chase: target, runs remaining, balls/overs remaining, and required rate.
- For multi-day formats: show only day/session information supported by the selected format;
  do not invent session state for formats that do not track it.
- Current weather, pitch, and outfield as secondary context.

Numbers should use tabular figures and remain readable at phone widths.

### Main play area

On desktop, organize the stage into a clear match-control workspace:

- **Scorecard / ball history:** A compact batting order, current-over tracker, and recent
  commentary. Expand the full scorecard using the existing scoreboard modal.
- **Pitch and field view:** An original, lightweight top-down field diagram that identifies the
  target sector, field preset, and recent ball outcome. Keep exact values and field names in
  adjacent text for accessibility.
- **Live players and tactics:** Highlight the striker, non-striker, and bowler with relevant
  form/ability and current figures. Place the controls for the user-controlled side beside this
  area.
- **Delivery action:** A prominent Play Next Ball action with disabled/loading feedback.
  Keep over/full-match simulation actions secondary and available only in the existing
  simulation cases.

On mobile, use a single-column layout. Keep score and the primary delivery action easy to reach;
place scorecard and commentary in compact tabs or collapsible sections inside the stage. Do not
add nested horizontal scrolling or conflict with the dashboard's Panel / Play / Notes navigation.
Test portrait, landscape, and a 375px viewport.

### Batting decisions

Use a small set of cricket-readable choices:

- **Approach:** Defend, Balanced, or Attack. Map existing Defend / Normal / Hit Big behavior to
  these profiles during migration.
- **Shot intent:** Leave/defend, rotate strike, drive, cut/pull, or loft. Offer only shots that
  make sense for the active batter and delivery context.
- **Target sector:** Third man, point, cover, mid-off, straight, mid-on, midwicket, square leg,
  or fine leg. Make each field-map area clickable and keyboard-operable instead of using separate
  target buttons. Highlight the selected area and treat it as a bounded probability modifier, not
  exact ball direction or fielder placement.
- Keep Super Shot and Free Hit as contextual special actions, with their current eligibility,
  usage limits, and explanatory disabled reasons.

Approach should persist until changed. A shot/target choice should have a defined lifetime
(one delivery by default, with an explicit option to retain it) so that an old choice is never
silently applied to a new batter or a special free-hit situation.

### Bowling and field decisions

Use a compact over-level plan plus a per-delivery choice:

- **Plan:** Attack, Build Pressure, or Contain Runs. Preserve Wicket Ball / Save Run behavior as
  compatibility mappings while the new plan is introduced.
- **Line and length:** A simple pitch target grid for Off / Middle / Leg line and Full / Good /
  Short / Yorker length. Keep a labeled select/grid alternative for keyboard and screen-reader
  users.
- **Variation:** Offer stock delivery plus only variations supported by the selected bowler's
  pace/spin attributes and current rules. Special Bowl remains a separate limited action.
- **Field preset:** Attacking, Balanced, or Defensive, with an original field diagram showing
  the intended coverage. Changing the field should normally be an over-level decision, not an
  extra required choice on every ball.

The UI must make current bowler, over eligibility, the selected plan, field preset, and any
resource limits visible before the user delivers the ball.

The detailed, bowling-only plan compares the current intent actions and their probability
effects, then specifies bowling controls, match information, state migration, and validation:
[live-bowling-gameplay-plan.md](./live-bowling-gameplay-plan.md).

## State and outcome contract

Keep existing `battingIntent` and `bowlingIntent` values during the first release so saved games
and current callers remain compatible. Add validated tactical settings as additive game state,
for example:

```js
battingTactics: {
  approach: 'balanced',
  shot: 'rotate',
  target: 'straight',
  retainShotAndTarget: false,
},
bowlingTactics: {
  plan: 'balanced',
  line: 'off',
  length: 'good',
  variation: 'stock',
  field: 'balanced',
},
```

Implemented batting values are `defend` / `balanced` / `attack`; `leave` / `rotate` / `drive` /
`cutPull` / `loft`; and the nine field sectors. Approach persists until changed. Shot and target
reset after each delivery unless retention is enabled; they always reset around a new batter, a
free hit, or the next innings. Older `off` and `leg` targets migrate to `cover` and `midWicket`.
Defaults keep the existing outcome distribution unchanged. Hydration merges safe defaults into
old saves, and match/career resets clear tactics.

Pass one immutable tactical-plan snapshot into `processDelivery` and `resolveOutcome`. Translate
plans into bounded probability adjustments alongside existing ability, pitch, weather, outfield,
and match-format adjustments. Keep the outcome weights normalized to 100. Do not guarantee the
chosen shot or wicket; tactics should change odds, not bypass the simulator.

Return structured delivery metadata (selected plan, target/line/length, outcome, runs, wicket,
and legal-ball status) for the ball tracker. Keep current commentary strings working for old
saves and current consumers; add optional structured events rather than silently changing the
commentary format.

## Implementation phases

### Phase 1: Lock the rules and state contract — implemented

- Define valid batting, bowling, line, length, variation, and field-preset values.
- Define which choices persist for a delivery, an over, or the innings.
- Document which options are available for each match format and bowler type.
- Add default and hydration/reset behavior in [gameState.js](./gameState.js) and
  [gameSlice.js](./gameSlice.js).
- Keep legacy intent fields and map old saves to safe defaults.

### Phase 2: Build the live-match cockpit without changing outcomes — implemented

- Split the growing innings screen into focused components such as match status, active-player
  cards, tactics, field view, over tracker, and ball commentary; keep every authored code/style
  file under 500 lines.
- Recompose the two innings paths in [LiveMatchStages.js](./components/LiveMatchStages.js) while
  preserving existing scoreboard, save, openers, next-batter, next-bowler, and simulation flows.
- Reuse existing theme tokens from `src/styles/design-system/`; provide loading, selected,
  disabled, focus, and reduced-motion states.
- Keep the existing intent controls visible and functional during this UI-only phase.

### Phase 3: Add batting tactics — implemented

- Add approach, shot-intent, and target-sector controls to the batting view.
- Add selectors/action creators and pass the selected plan through
  [controllerInningsViewModel.js](./hooks/controller/controllerInningsViewModel.js),
  [useCricketSimulatorController.js](./hooks/useCricketSimulatorController.js), and
  [LiveMatchStages.js](./components/LiveMatchStages.js).
- Implement a focused modifier table in [controllerOutcomeUtils.js](./utils/controllerOutcomeUtils.js).
- Show the plan used and the result in the current-ball feedback.
- Preserve Super Shot / Free Hit eligibility and existing limits.
- `BattingTacticsPanel.js` exposes the approach, one-ball shot call, target map, optional retention,
  special actions, match pressure, player matchup, and current-over tracker.

### Phase 4: Add bowling tactics and field presets — implemented

- Add line/length, supported variation, and field-preset choices to the bowling view.
- Persist over-level field/plan choices and surface bowler changes and over limits clearly.
- Apply bounded interactions between batting target and bowling line/length/field in the
  probability model.
- Provide quick presets so a user can deliver with one or two actions when they do not want to
  adjust every tactical detail.

### Phase 5: Structured ball tracker and match feedback — implemented

- Add a structured per-delivery event list to innings state, while retaining the current
  commentary array for compatibility.
- Render legal balls, extras, wickets, and boundaries with text labels and accessible status;
  allow a recent delivery to be selected for detail.
- Show how the current approach affected the delivery without overloading commentary.
- Ensure user choices remain paused/visible during the existing Auto Play or simulation flows.

### Phase 6: Balance, compatibility, and release

- Tune outcome modifiers with deterministic unit tests and seeded scenario simulations across
  T20, ODI, and Test formats.
- Compare outcomes against the current engine baseline; reject modifiers that overwhelm player
  abilities, match conditions, or existing special-action limits.
- Validate mobile, desktop, keyboard, screen reader labels, contrast, and reduced motion.
- Update the Gameplay Controls section of [README.md](../../../README.md) after behavior and labels
  are finalized.

## Test plan

- **UI:** Update [InningsStage.test.js](./components/InningsStage.test.js) and
  [LiveMatchStages.test.js](./components/LiveMatchStages.test.js) for batting/bowling role
  changes, selected tactic states, disabled reasons, field-map alternatives, delivery feedback,
  and existing primary/secondary actions.
- **View model:** Update
  [controllerInningsViewModel.test.js](./hooks/controller/controllerInningsViewModel.test.js)
  for supported variations, special-action eligibility, and safe defaults.
- **Probability model:** Update
  [controllerOutcomeUtils.test.js](./utils/controllerOutcomeUtils.test.js) to prove modifiers
  change the intended run/wicket/boundary probabilities, weights remain normalized, and free-hit
  and special-action rules remain valid.
- **Delivery engine:** Update
  [controllerDeliveryEngine.test.js](./hooks/controller/controllerDeliveryEngine.test.js) and
  [controllerDeliveryEngineOvers.test.js](./hooks/controller/controllerDeliveryEngineOvers.test.js)
  for tactic snapshots, structured event output, extras, wickets, strike changes, over changes,
  and selection of the next bowler/batter.
- **State and saves:** Update [gameSlice.test.js](./gameSlice.test.js) for initial state,
  resets, legacy hydration defaults, and restored tactical state.
- **Regression:** Keep existing intent and action tests; verify auto-play, saving, loading,
  scoreboard, and match-end flows.

## Acceptance criteria

- Users can make meaningful batting and bowling decisions beyond a single intent button.
- A ball can be delivered quickly using a preset/default; advanced controls are optional.
- Tactical settings visibly affect outcomes through tested, bounded probability changes.
- Outcome totals remain valid, and existing free-hit, special-ball, wicket, over, and innings
  rules continue to pass.
- Old saved games load with safe defaults; new saves restore pending tactics and ball history.
- Both innings support the appropriate batting/bowling controls; the AI-controlled side does not
  expose player-only controls.
- The live screen fits a 375px viewport without horizontal overflow, has touch targets of at
  least 44px, and is keyboard/screen-reader operable.
- The final design uses this project's own style and vector graphics rather than copied game
  assets.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Too many choices slow each ball | Make approach and field persist; offer quick presets and balanced defaults. |
| New tactics overpower player stats or match conditions | Use small, bounded modifiers and deterministic/scenario balancing tests. |
| Old saves lack new fields | Add hydration defaults; retain existing intent keys until a later migration is proven safe. |
| Field map is hard to use on mobile or with assistive technology | Pair every map target with labeled controls and a text description. |
| Screen becomes data-dense | Prioritize score, active players, one tactical panel, and next-ball action; keep detail in tabs/expanders. |
| Files grow beyond project limits | Split cockpit sections into focused components and stylesheets under 500 lines. |
