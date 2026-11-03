# Apex Cricket — Product and Functionality Overview

## Why this document exists

Use this as product context when asking Stitch to redesign Apex Cricket. It describes the current user-facing functionality and the states a redesign needs to support. It is not a requirement to preserve the current visual layout: the UI can be redesigned completely, but the interactions and game behavior below should remain available.

## Product at a glance

Apex Cricket is a browser-based, single-player cricket simulation game. A player configures a match or longer game mode, manages both playing XIs, and plays or simulates cricket innings against computer-controlled opponents. The central experience is strategic, ball-by-ball cricket with changing match state, delivery commentary, detailed scorecards, and persistent saves.

The app is built as a React web app. After signing in, the user works inside one dashboard route. The match setup, live match, results, series, tournaments, and career screens are different states of the simulator embedded in that dashboard—not separate website pages today.

### Product and interaction principles

- Make cricket scores, match context, and the next useful action immediately obvious.
- Keep the live match readable while the user makes batting/bowling decisions and follows commentary.
- Distinguish setup, live play, completed results, and long-form competition management.
- Make selections and progress visible: chosen format, teams, conditions, XI count, roles, innings, overs, and target.
- Treat unavailable actions, loading, save confirmation, and destructive confirmation as real UI states.
- Keep the experience responsive. Dense tables and management screens need an intentional mobile layout, not just desktop scaling.
- Use team names and available flags/logos, player role/type, and cricket-specific terminology consistently.

## Users, authentication, and entry points

### Account creation

The registration form collects:

- Name
- Email
- Age
- Country
- Password and password confirmation

It validates required fields, age range, email format, minimum password length, and matching passwords. A successful sign-in or registration leads to the dashboard.

### Sign in

Users can sign in with email/password or Google. Forms show validation and authentication errors and a loading state while a request is in progress. A signed-in user is redirected to the dashboard.

### Dashboard shell

The authenticated dashboard currently contains:

- A welcome header and logout action.
- The primary simulator/work area.
- Match Notes with the current format, selected teams, location, stadium, conditions, and toss information as these become available.
- A contextual Quick Panel for regular users; administrators can instead see diagnostic information such as selection composition and live simulation factors.
- Recent Match History on the simulator's initial screen, showing up to the last ten completed matches with innings scores, result, and date.

Keep the simulator as the focus. Dashboard side information is secondary and should not obscure the main game action, particularly during live play.

## Main experience and user journey

The simulator is a staged flow. Setup screens have a stage/progress indicator, a title and helper text, and a back action where applicable. A redesign may improve the navigation or group related setup steps, but should preserve all decisions and keep the user oriented.

### 1. Start screen and saves

The initial simulator screen lets the user:

- Start match setup.
- Browse saved matches when available.
- Load a save and resume the saved game state.
- Delete a save after confirming the destructive action.

Saved-match entries show a title, last-updated time, and a compact match/progress summary. The screen may show a loading state while saves load and feedback after save operations.

### 2. Choose a game mode

The available game modes are:

- **Quick Match** — one standalone match.
- **Series** — multiple matches between the same two teams.
- **Tournament** — a 4-, 8-, or 16-team knockout, including the user's team.
- **Career** — create a player and progress through domestic seasons.

In Series mode, select a series length of 2–7 matches.

In Tournament mode, select 3, 7, or 15 opponents in addition to the user's team. The user can randomize or edit first-round fixtures and dates before confirming them. Knockout progression leads to a champion and tournament summary.

### 3. Select match format

Available standard and practice formats:

| Format | Overs per innings | Innings | Duration profile |
|---|---:|---:|---:|
| Micro | 1 | 1 | 1 day |
| Mini | 5 | 1 | 1 day |
| T10 | 10 | 1 | 1 day |
| T20 | 20 | 1 | 1 day |
| ODI | 50 | 1 | 1 day |
| Test | 90 | 2 | 5 days |
| Practice Test Micro | 90 | 1 | 2 days |
| Practice Test Mini | 90 | 2 | 4 days |

These values describe the format profile shown by the game; the existing simulator flow remains authoritative for the actual match behavior.

### 4. Choose teams and venue

For a normal match, the user chooses:

1. Their national team.
2. An opponent team (the user's own team is not selectable as its opponent).
3. The country hosting the match.
4. A stadium in that country.

Team choices use country/team identity such as flags and rankings. Stadium information includes venue/location, capacity, pitch type, and outfield type. Match conditions include weather, pitch, and outfield and affect simulation outcomes. Show these as meaningful context, not just decorative labels.

Tournament mode uses the selected country teams as participants and allows the user to configure fixtures rather than choosing one opponent.

### 5. Choose commentator

The user chooses a speech-synthesis voice for match commentary. The available list comes from the browser. A voice can be previewed/tested; if the voice list is still loading, the screen explains that state. Commentary is also shown as text in the live match feed.

### 6. Toss

The user calls one of two toss options (shown as Crown or Dollar in the current UI). The result screen announces the winner:

- If the user wins, they choose whether to bat or bowl first.
- If the opponent wins, its decision is displayed and the user confirms the only remaining continuation choice.

The toss flow should present selected conditions and communicate the innings order clearly.

### 7. Select each playing XI

The user selects the XI for their team and then the opponent. Each team selection screen includes:

- Available players and the selected XI, with player name/type and ability summaries (batting against pace/spin and pace/spin bowling).
- Add/remove by selecting a player and drag-and-drop between the available and selected lists.
- An exact 11-player requirement and visible progress (for example, 8/11).
- Auto Pick 11.
- Create Custom Player.
- Role assignment: captain, vice-captain, and wicketkeeper. Captain and vice-captain must be different; wicketkeeper is chosen from eligible wicketkeeper players.
- A continue/start action that is disabled until the XI and required roles are valid.

Provide a custom-player creation modal/form and preserve all role and roster validation feedback. The opponent XI is also managed, with auto-pick available.

### 8. Play an innings

The live screen is the most important and information-dense state. It must support two innings and clearly show:

- Batting team, innings number/phase, current score and wickets.
- Overs bowled and format overs; in the second innings, the chase target and progress toward it.
- Current striker, non-striker, and bowler when selected.
- The last delivery/result and a chronological ball-by-ball commentary feed, with over.ball labels where available.
- A clear next-ball action.
- Contextual player selection when needed: choose opening batters, the next batter after a dismissal, or the next bowler.
- Strategy/intention controls when the user is batting or bowling. Batting options include defensive/normal/aggressive and special/free-hit situations; bowling options include normal, wicket-taking, run-saving, and special-ball intents. Available actions can depend on match state and may be disabled with an explanation.
- Save Game and feedback for the save operation.
- Show/Hide Scoreboard.

The detailed scoreboard presents batting rows (batter, runs, balls, strike rate, dismissal) and bowling rows (bowler, overs, runs conceded, economy, average per wicket, wickets). Test-style multi-innings matches may need the current and previous innings scorecards together.

In eligible AI-only matches/fixtures, offer simulation controls to simulate an over or the full match. These are not a substitute for user-controlled play when the user is involved in the match. During automatic simulation, show progress/disabled controls to prevent conflicting actions.

### 9. Match result and Man of the Match

The result screen shows:

- First- and second-innings team scores, wickets, and overs.
- A clear match result/summary (including winner/tie as appropriate).
- A full scoreboard toggle.
- Up to five ranked Man of the Match recommendations with performance details and a recommended indicator.
- A way to select the Man of the Match; selection triggers an announcement/commentary experience.
- A mode-aware primary action: new match, next series match, next knockout match, or return to a career schedule.

For career progression, continuing can automatically use the top Man of the Match recommendation if one has not already been selected.

## Long-form game modes

### Series

After each match, the user can proceed to the next match or view the series summary. The summary includes:

- Series win/tie standings between the selected teams.
- Per-match results and summaries.
- Top ten run scorers with batting statistics.
- Top ten wicket takers with bowling statistics.
- An action to start a fresh match.

The chosen format, teams, and series context should remain visible throughout the series.

### Tournament

Tournament setup includes opponent count/team selection, first-round fixture editing, optional fixture randomization, dates, and confirmation. The app advances through knockout matches and resolves the champion. The final tournament screen includes:

- Champion recognition.
- Knockout results by round and match.
- Top ten tournament run scorers and wicket takers.

Show the bracket/fixture progression and the user's path through the knockout clearly in the redesign.

### Career

Career mode is a player-management journey, distinct from a single match setup.

**Career setup**

- Create a player name, age (16–40), nationality, and playing role.
- Roles include batsman, bowler, wicketkeeper, pace allrounder, spin allrounder, pacer, and spinner.
- Choose a domestic-league country.
- Generate domestic clubs and the global player pool.
- Choose a short, standard, or full season length.
- Begin a career and its player auction.

**Auction**

The auction screen reveals a generated auction timeline with player bids, sales, winning clubs, and the career player's auction moment. It includes playback/pause behavior and evolving club budgets, spending/signings, domestic/foreign quotas, and role requirements. The screen should make the player's team/offer outcome and auction progression easy to understand.

**Season schedule and matches**

- Career dashboard context includes the player's profile/age, club, season, completed fixture count, and next fixture.
- Users can show the full schedule or focus on the next fixture.
- AI fixtures can be simulated to reach the next user club match; completed fixtures can be opened to inspect their result/scoreboard.
- League standings and statistics are available across formats, with player/club history and format filters.
- The user plays matches for their club using the same match and innings UI.

**End of season**

Season summaries include standings by format, the user's club position, season progress, top run scorers and wicket takers, player progression/ability changes, and season awards (including best batter, best bowler, young player, player of the year, and most Man of the Match awards).

Users can start another season, end the career, or retire when eligible. Career history includes player profile, active/retired status, all-time batting/bowling leaders, season standings, awards, and ability changes.

## Match data and information hierarchy

Across screens, these are important entities and should be visually distinct:

- **Teams:** name, flag/logo, ranking where available.
- **Players:** name, role/type, player abilities; career players also have age/nationality and accumulated stats.
- **Match configuration:** format, innings/overs, game mode, series/tournament/career context.
- **Venue/conditions:** country, stadium, weather, pitch, and outfield.
- **Live state:** innings, score/wickets, overs, target, batting pair, current bowler, last event, commentary.
- **Tables/statistics:** batting, bowling, standings, fixtures, leaders, awards, and progression.

Use compact but legible cricket tables. On narrow screens, preserve access to all fields with responsive table treatment (such as stacked rows, horizontal scrolling within a contained table, or focused detail views) rather than shrinking text excessively.

## Important states and feedback to design

- Authentication: empty form, validation errors, server error, loading, success/redirect.
- Simulator: initial state, save list loading/empty/populated, save feedback, delete confirmation.
- Setup: selected/unselected choices, unavailable choices, back/continue, progress.
- Team selection: available/selected lists, XI incomplete/complete, roles incomplete/complete, custom-player modal.
- Toss: awaiting call, result, user decision, opponent decision.
- Live innings: normal play, waiting for openers/batter/bowler, disabled strategy with reason, automatic simulation, saving, scoreboard open/closed.
- Results: selected/unselected Man of the Match, empty/available recommendations, next action appropriate to the active mode.
- Career and competitions: loading/empty/completed fixtures, upcoming fixture, auction playback/paused/final, standings, season transition, retirement eligibility.
- Error and empty states should explain what happened and what the user can do next.

## Design direction for Stitch

Create a coherent design system for the product, then generate the screens as related parts of the same application. A strong sports-simulation identity is appropriate, but keep score and controls more prominent than atmospheric decoration. Avoid visual language associated with gambling or betting; this is a cricket simulator.

Suggested screen/design set:

1. Login and registration.
2. Dashboard landing with Start Match, saved games, and recent history.
3. Game mode and format selection.
4. Team, venue, and stadium selection.
5. Toss and toss result.
6. XI management, including role assignment and custom player modal.
7. Live innings in both batting and bowling states, with scoreboard open and closed.
8. Match result with Man of the Match selection.
9. Series summary.
10. Tournament fixtures/bracket and champion screen.
11. Career setup, auction, season schedule, season summary, and history.

For a first generation, prioritize the dashboard landing and live innings. Then use those as the visual foundation for the setup and competition screens.

## Suggested initial Stitch prompt

> Design a polished desktop-first and responsive web app for Apex Cricket, a single-player cricket simulation game. This is not a betting or fantasy sports product. The authenticated dashboard hosts a stateful simulator with four modes: Quick Match, Series, Tournament knockout, and player Career. Create a coherent cricket-focused design system and an information-dense but readable live innings screen. The live screen must show batting team, score/wickets, overs, chase target when relevant, striker/non-striker/bowler, contextual player choices, batting or bowling intent controls, a prominent Play Next Ball action, a ball-by-ball commentary feed, Save Game, and a toggleable full batting/bowling scorecard. Also establish how the dashboard will present Start Match, saved games, recent match history, and contextual match notes. Keep navigation and responsive behavior clear. Do not invent betting, multiplayer, or features outside this product overview.

## Implementation boundary

Stitch outputs are design inputs. The current application already owns authentication, routes, game rules, simulation state, persistence, and match progression. A redesign should replace or adapt presentation while preserving those behaviors and the existing React application structure.
