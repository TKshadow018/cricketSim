# Bowling field settings

When bowling, choose one of 12 fields in the bowling tactics panel:

| Preset | Typical use | Arcade outcome profile |
| --- | --- | --- |
| Balanced | General-purpose mix | Balanced |
| Attacking | Close catching | Attacking |
| Boundary | Protecting the rope | Boundary |
| New ball | Seam bowling with slips and gully | Attacking |
| Spin attack | Close catching for a spinner | Attacking |
| Powerplay | Early overs with a slip and deep protection | Pressure |
| Ring | Restricting strike rotation | Ring |
| Middle overs | Infield pressure and deep protection | Pressure |
| Death overs | Late-innings boundary protection | Boundary |
| Off side | Fielders concentrated off side | Pressure |
| Leg side | Fielders concentrated on the leg side | Pressure |
| Defend single | Challenging a quick single | Ring |

These are illustrative tactical layouts. In Arcade their outcome profiles are abstract:
attacking increases wicket and boundary weights,
boundary protection reduces boundary and wicket weights, pressure reduces single and four
weights while increasing wicket weight, and ring fields reduce single weight while increasing
four and wicket weights. For user-controlled bowling, Arcade does not model the direction
of individual shots; Realism does.

Open
**Customize field positions** to move the nine numbered fielders to named positions on the
field map. The wicketkeeper and bowler stay fixed, and two fielders cannot occupy the same
position. Editing any fielder creates a custom field from the current layout; a preset does
not need to be selected first.

When batting, the opposition selects a field automatically. See
[opponent-fielding.md](./opponent-fielding.md) for its selection and coverage effects.

The field remains active between deliveries and is saved with the match. Choosing a preset
replaces the custom field. Match and innings resets follow the existing bowling tactics reset
rules.

Field locations and coverage are approximate. In Arcade, custom layouts use the closest
preset's modifiers, with ties resolved in the order above. In Realism, the actual positions
affect both sides' outcomes and fielding restrictions are enforced; invalid layouts must be
corrected before bowling. See [match-outcome-model.md](./match-outcome-model.md) for the
ruleset differences and restrictions.
