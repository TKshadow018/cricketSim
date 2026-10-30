# Player skills

`skillList.js` defines 20 skills. Each catalog entry has a `name`, an `affects` domain (`batting`, `bowling`, `fielding`, or `personality`), and a `frequency` percentage. Career Mode rolls each eligible skill at that percentage, then keeps at most two per player. Bowling and batting skills are limited to the matching player role; fielding and personality skills can be assigned to any role.

National rosters use explicit player-name assignments reflecting known strengths rather than ability ratings. Unlisted players have no special skills, and curated national players retain at most two skills when imported into Career Mode.
