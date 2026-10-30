# Cricket Sim Arena

Cricket Sim Arena is a stage-based cricket simulator built with React + Redux + Firebase.  
You set up match conditions (teams, stadium, commentator, toss, XI), then control innings ball-by-ball with batting and bowling intents, dynamic commentary, scoreboards, save/load, and a Man of the Match recommendation system.

## Table of Contents

- [What You Can Do](#what-you-can-do)
- [Interface Design](#interface-design)
- [How to Play (Full Match Flow)](#how-to-play-full-match-flow)
- [Gameplay Controls](#gameplay-controls)
- [Man of the Match (MoM)](#man-of-the-match-mom)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Available Scripts](#available-scripts)
- [Game Data Customization](#game-data-customization)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## What You Can Do

- Register/login with Email/Password or Google.
- Configure match format (micro, mini, T10, T20, ODI, Test variants).
- Select own team, opponent, location country, and stadium.
- Use stadium-driven pitch/outfield conditions and weather display.
- Choose commentator voice with generated realistic display names.
- Complete toss flow with user/opponent decision handling.
- Build both XIs (drag/drop + auto-pick + custom player creation).
- Assign Captain, Vice Captain, and Wicketkeeper roles.
- Play every ball with batting/bowling intent controls.
- Save/load match states (manual + autosave when applicable).
- View full scoreboard tables for batting and bowling.
- Get top-5 MoM suggestions and select winner with announcement.

## Interface Design

The auth screens, dashboard, match setup, live innings, results, and career views share the
stadium-inspired theme in `src/styles/design-system.css`. Its semantic CSS variables define the
ink-green surfaces, high-contrast text, and lime primary action color. Desktop uses a full-height
workbench with a primary stage between context panels. Phones use a focused main view with
Panel/Play/Notes bottom tabs. Long stages scroll inside the main stage viewport, and stage changes
return that viewport to its top. Career analytics actions and player-type choices wrap inside
their panels rather than extending the page width. Keep page-specific styles on the shared tokens,
maintain visible keyboard focus and 44px+ controls, and keep detailed scorecards in dismissible
dialogs. Styles are grouped by area in `src/styles/design-system/`: foundation/auth,
dashboard/choices, gameplay surfaces/data, match states/breakpoints, interaction/accessibility,
viewport layout/overflow, and scoreboard modal.

Career creation is a four-step flow: Player Details, Playing Style, Domestic League, and Review
& Start. The club pool must be generated before continuing. National players are randomly
distributed among their country's clubs, with at least one per club; squad limits are preserved
and career seasons use one cycle.

## How to Play (Full Match Flow)

The simulator progresses through these stages:

1. **Intro**  
	Start a new match setup, load existing saves, or delete a save.

2. **Choose Match Type**  
	Pick overs/innings profile (e.g., T20 or ODI).

3. **Choose Your Team**  
	Select your national side.

4. **Choose Opponent**  
	Select rival team.

5. **Choose Match Country**  
	Select host country.

6. **Choose Stadium**  
	Pick exact venue. Pitch and outfield traits are shown and used in simulation.

7. **Choose Commentator**  
	Select voice; UI shows generated commentator aliases.

8. **Toss Time**  
	Call heads/tails.

9. **Toss Result**  
	Winner decides bat/bowl. If opponent wins, follow prompted continuation choice.

10. **Select Your XI**  
	 Choose exactly 11 players, assign a captain, a different vice-captain, and a wicketkeeper. At least 5 players must be pace all-rounders, spin all-rounders, pacers, or spinners.

11. **Select Opponent XI**  
	 Choose opponent XI and roles (or auto-pick); the same XI and role requirements apply.

12. **Team One Bat**  
	 Ball-by-ball first innings.

13. **Team Two Bat**  
	 Chase innings with target tracking.

14. **Match End**  
	 Final summary, full scoreboard, MoM suggestions, and new match action.

## Gameplay Controls

### During Innings

- **Batting tactics** (when your side is batting): set a persistent Defend, Balanced, or Attack approach; choose a shot intent and select one of nine target sectors directly on the interactive field map.
- Shot and target calls reset after a delivery by default. Enable **Keep shot & target for next ball** to retain them; a new batter or free-hit situation always gets a fresh call.
- **Super Shot** and **Free Hit** remain contextual actions and follow their existing ability, credit, and dismissal rules.
- **Bowling Plan** (when your side is bowling): choose Balanced, Attack, Build Pressure, or Protect Boundaries.
- Set a field preset and call line, length, and a bowler-compatible variation for the next ball.
- Arm a Special Delivery explicitly; the cockpit shows eligibility, remaining credits, and over use.
- Use the over ball tracker to review legal deliveries and extras alongside the selected plan.
- **Play Next Ball** advances simulation one delivery.
- **Choose Openers / Next Batsman / Next Bowler** appears contextually when required.
- **Show/Hide Scoreboard** toggles detailed innings tables.
- **Save Game** stores current state to Firestore.

### XI & Roles

- Drag players between available and selected lists.
- XI must be **exactly 11**.
- Captain and Vice Captain must be different.
- Wicketkeeper must be set.
- You can create custom players and auto-pick XIs.

### Planned Engine Improvements

The [settings and fielding impact plan](src/features/game/match-engine-settings-impact-plan.md)
compares three approaches to deeper batting, bowling, and field-placement interactions, with
a recommended design and validation roadmap. It is a proposal only; gameplay is unchanged.

## Man of the Match (MoM)

- At match end, simulator generates **Top 5** MoM recommendations.
- Rank #1 is flagged as **Recommended**.
- Each player entry includes batting/bowling summary and point breakdown notes.
- Clicking the tick button selects MoM and triggers commentary announcement.

## Local Setup

### Prerequisites

- Node.js 26.12.1 or newer (the project runtime is pinned in `.nvmrc`)
- npm 9+
- Firebase project (for auth + saves)

### Install & Run

If you use nvm, select the project Node.js version with `nvm use`.

1. Install dependencies:
	```bash
	npm install
	```
2. Create local env file:
	```bash
	cp .env.example .env
	```
	(On Windows PowerShell: `Copy-Item .env.example .env`)
3. Update `.env` values for your Firebase project. For local auth bypass, set `REACT_APP_DEBUG=true`.
4. Start development server:
	```bash
	npm start
	```
5. Open app in browser (CRA default: `http://localhost:3000`).

## Environment Variables

Set these in `.env`:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`
- `REACT_APP_FIREBASE_ADMIN_EMAIL` (optional/admin-specific usage)
- `REACT_APP_DEBUG` (`true` to bypass authentication locally; defaults to `false`)
- `REACT_APP_DEBUG_MODE` (legacy alias for debug auth bypass)

### Debug Mode

Set `REACT_APP_DEBUG=true` in `.env` to bypass login during local development. `REACT_APP_DEBUG_MODE=true` is also supported for compatibility. When enabled, protected routes open without sign-in and auth-backed save/history data is stored in the browser instead of requiring Firebase authentication.

Leave debug flags unset or `false` for normal and production deployments.

## Firebase Setup

### 1) Set Firebase Project ID

Update `.firebaserc`:

```json
{
  "projects": {
	 "default": "your-firebase-project-id"
  }
}
```

### 2) Enable Authentication Providers

In Firebase Console:

- Authentication → Sign-in method
- Enable **Email/Password**
- Enable **Google** (if using Google login)

### 3) Deploy Firestore Rules

```bash
npx firebase-tools login
npm run firebase:rules
```

Current rules scope user data to authenticated owner paths under:

- `users/{uid}`
- `users/{uid}/gameSaves/{saveId}`

### 4) Deploy Hosting

```bash
npm run firebase:deploy
```

## Available Scripts

- `npm start` — start local development server.
- `npm run build` — create production build.
- `npm test` — run tests.
- `npm run firebase:rules` — deploy Firestore rules.
- `npm run firebase:serve` — build + run Firebase Hosting emulator.
- `npm run firebase:deploy` — build + deploy to Firebase Hosting.

## Game Data Customization

### Players by Nation

- Source folder: `src/gameData/players/`
- Mapping entry: `src/gameData/playerListForNation.js`

### Stadiums by Country

- Source folder: `src/gameData/stadiums/`
- Mapping entry: `src/gameData/stadiumListForCountry.js`
- Compatibility export: `src/gameData/stadiums.js`

Each stadium entry should include at least:

- `name`
- `location`
- `capacity`
- `pitchType` (enum key)
- `outfieldType` (enum key)

Valid condition keys are defined in:

- `src/gameData/matchCondition.js`

## Project Structure

```text
src/
  app/
  components/
  features/
	 auth/
	 game/
		components/
		hooks/
		CricketSimulator.js
		gameSlice.js
		simulator.css
  firebase/
  gameData/
	 players/
	 stadiums/
  pages/
  routes/
  utils/
```

## Troubleshooting

### "Missing or insufficient permissions"

- Confirm Firestore rules are deployed:
  ```bash
  npm run firebase:rules
  ```
- Ensure logged-in user matches document owner path (`users/{uid}`).

### Voices not appearing in commentator selection

- Keep page open briefly; browser speech voices can load asynchronously.
- Verify browser supports `speechSynthesis`.

### Save/Load not visible

- Ensure you are logged in.
- Verify Firebase config values in `.env` are correct.

### Need to run without auth locally

- Set `REACT_APP_DEBUG_MODE=true` in `.env`.
- Restart the dev server after changing env values.

### Build issues

- Clean install dependencies:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

### Firebase `auth/invalid-api-key`

- For Firebase authentication, set a valid `REACT_APP_FIREBASE_API_KEY` and the other Firebase values in `.env`, then restart the development server.
- To run locally without Firebase credentials, set `REACT_APP_DEBUG=true` in `.env` and restart. Debug mode skips Firebase initialization and stores game data in browser local storage.

---