# Cricket Sim Arena

Cricket Sim Arena is a stage-based cricket simulator built with React + Redux + Firebase.  
You set up match conditions (teams, stadium, commentator, toss, XI), then control innings ball-by-ball with batting and bowling intents, dynamic commentary, scoreboards, save/load, and a Man of the Match recommendation system.

## Table of Contents

- [What You Can Do](#what-you-can-do)
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
	 Choose exactly 11 players, assign captain/vice-captain/wicketkeeper.

11. **Select Opponent XI**  
	 Choose opponent XI and roles (or auto-pick).

12. **Team One Bat**  
	 Ball-by-ball first innings.

13. **Team Two Bat**  
	 Chase innings with target tracking.

14. **Match End**  
	 Final summary, full scoreboard, MoM suggestions, and new match action.

## Gameplay Controls

### During Innings

- **Batting Intent** (when your side is batting): Defend, Normal, Hit Big, Super Shot, Free Hit (when armed).
- **Bowling Intent** (when your side is bowling): Normal, Wicket Ball, Save Run, Special Ball.
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

## Man of the Match (MoM)

- At match end, simulator generates **Top 5** MoM recommendations.
- Rank #1 is flagged as **Recommended**.
- Each player entry includes batting/bowling summary and point breakdown notes.
- Clicking the tick button selects MoM and triggers commentary announcement.

## Local Setup

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- Firebase project (for auth + saves)

### Install & Run

1. Install dependencies:
	```bash
	npm install
	```
2. Create local env file:
	```bash
	cp .env.example .env
	```
	(On Windows PowerShell: `Copy-Item .env.example .env`)
3. Update `.env` values for your Firebase project.
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

### Build issues

- Clean install dependencies:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

---