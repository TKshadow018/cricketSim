# Opponent fielding system

## Arcade behavior

- Before a user-controlled batting delivery, the computer selects a preset from the current
  innings, match format and chase target. Selection is deterministic and independent of the
  batter's pending shot, so changing a shot cannot move the field. The same selection is
  shown on the batting screen and passed to the outcome engine.
- Limited-overs matches use a powerplay field early, a middle-overs field, and a death-overs
  field late. A side close to winning with one run needed faces an infield. A side with many
  wickets down can face an attacking field in the middle overs. When a chase needs at least
  ten runs per over in its last five overs, the computer can switch to boundary protection
  earlier. Test-style matches start with
  a new-ball field and otherwise use a balanced or attacking field.
- Named positions are grouped into approximate scoring sectors and infield/deep coverage.
  An infield fielder makes a single slightly less likely; deep coverage reduces fours and
  converts some weight to twos. For an aerial shot, a deep fielder can also reduce sixes and
  increase wickets slightly. These are small raw outcome-weight changes, not guarantees.
- The field is recalculated from the saved match situation before every delivery and recorded
  in ball history. No new required save state or random draws are introduced. The field only
  affects user batting; existing user bowling and computer-only matches retain their behavior.

In **Realism**, both sides use actual preset or custom coordinates, an executed shot sector,
optional fielder ability and batter handedness. The computer selects a legal field before the
shot, and the displayed field is the one used by the engine. The model approximates coverage
rather than physically simulating a trajectory. See [match-outcome-model.md](./match-outcome-model.md)
for restrictions, calibration, and limitations.
