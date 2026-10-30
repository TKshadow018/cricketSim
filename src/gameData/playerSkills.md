# Player skills

`skillList.js` defines 20 skills. Each catalog entry has a `name`, an `affects` domain (`batting`, `bowling`, `fielding`, or `personality`), an icon path, and a `frequency` percentage. Career Mode rolls each eligible skill at that percentage, then keeps at most two per player. Bowling and batting skills are limited to the matching player role; fielding and personality skills can be assigned to any role.

National rosters store explicit skill arrays directly on each player record, reflecting known strengths rather than ability ratings. Players without a curated special skill have an empty array in the shared national roster data. The Career Mode profile displays each skill's icon, name, and domain.
