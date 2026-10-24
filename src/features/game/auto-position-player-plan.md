# Auto-Position Players Plan

## Goal

Add an **Auto Position Players** action to both team-selection stages. After an XI is selected, the action assigns batting positions 1–11 according to each player's `battingOrderPreference`. It does not select or remove players.

## Assignment Rules

1. Find a complete one-to-one assignment of the XI to positions 1 through 11.
2. Minimize the worst preference rank assigned to any player, then minimize the sum of all preference ranks. This prevents early greedy choices from pushing a strong batter into an unnecessarily poor tail position.
3. When multiple players can be assigned to the current position without worsening the best complete assignment, choose randomly among those candidates.
4. Require exactly 11 selected players and valid preference arrays containing each integer from 1 to 11 once.

The allocator is implemented in [autoPositionPlayers.js](./utils/autoPositionPlayers.js). Its random chooser is injectable so tests can make tie-breaking deterministic.

## UI and State Integration

1. Add an **Auto Position Players** button to the own-team and opponent-team XI stages in `PreMatchSelectionStages`.
2. Keep the action disabled until exactly 11 players are selected.
3. Invoke the allocator for that selected XI and display the resulting batting position beside each player.
4. Preserve assigned order through Redux state, selected-player rendering, match preparation, and save/load.
5. Do not rely only on reordering selected player IDs: the current selected-player view reconstructs players in roster order, and match preparation sorts by `battingOrderCoeff`. Ensure the explicit assignment is honored when building the playing XI without changing existing manual-selection behavior.
6. Add a role-based default preference for custom players and older saved players that lack a valid preference array. Validate inputs and surface an actionable error rather than silently assigning an invalid order.

## Bangladesh-Only Test Stage

The current prototype test uses an explicit 11-player Bangladesh XI from `Bangladesh.js`. It verifies:

- all selected players receive a unique position from 1 through 11;
- high-priority preference matches are chosen before lower-priority alternatives; and
- a random tie between first-choice openers responds to the injected random chooser.

The test is in [autoPositionPlayers.test.js](./utils/autoPositionPlayers.test.js). This tests the allocator only; it does not yet exercise either selection-stage button or match-order persistence.

## Acceptance Criteria

- Both selection stages can auto-position a complete XI without changing its membership or team roles.
- The selected XI displays positions 1–11 after assignment.
- The match uses the displayed batting order, including after save/load.
- Random ties are supported; tests use deterministic injected randomness.
- Custom and legacy players are handled explicitly.
- Bangladesh integration tests pass before extending coverage to other teams.

## Current Status

- Complete: pure allocator, Bangladesh-only tests, own-team and opponent-team selection buttons, Redux/save-load order state, selected-XI position labels, and match-order propagation.
- Custom and legacy players without preferences use a role-based fallback; invalid explicit preferences are surfaced in the selection screen.
- Complete: selection-stage tests cover the XI-count gate, button action, assigned-position labels, and placement before Continue.
- The Bangladesh regression test verifies that a top-order batter is not pushed to an 11th-choice position when a better complete assignment exists.
- Validation: full Jest suite and production build passed before the preference-balancing correction; the targeted Bangladesh allocator tests pass after the correction.
