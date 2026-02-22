# Cricket Sim

Simulation-focused gaming web app starter built with React, Redux Toolkit, and Firebase.
## Features

- Login and registration UI with reusable form components
- Redux auth state management with async thunks
- Firebase Authentication integration
- Firestore profile persistence
- Firebase Hosting configuration for SPA deployment

## Professional Folder Structure

```text
src/
	app/
		store.js
	components/
		auth/
			AuthCard.js
		layout/
			AuthLayout.js
		ui/
			AppButton.js
			AppInput.js
	features/
		auth/
			authSlice.js
			authThunks.js
	firebase/
		authService.js
		config.js
		firestoreService.js
	pages/
		DashboardPage.js
		LoginPage.js
		RegisterPage.js
	routes/
		AppRoutes.js
		RouteGuards.js
```

## Local Setup

1. Install dependencies:
	 - `npm install`
2. Create your environment file:
	 - Copy `.env.example` to `.env`
	 - Fill in your Firebase Web App credentials
3. Start dev server:
	 - `npm start`

## Firebase Hosting Setup

1. Replace `your-firebase-project-id` in `.firebaserc`
2. Login to Firebase CLI:
	 - `npx firebase-tools login`
3. Deploy:
	 - `npm run firebase:deploy`

## Firestore Permission Fix

If you see `Missing or insufficient permissions` after user creation, deploy Firestore rules:

1. Ensure Firebase CLI is authenticated:
	- `npx firebase-tools login`
2. Deploy rules from this project:
	- `npm run firebase:rules`

Current rules allow each authenticated user to read/write only their own document in `users/{uid}`.

## Google Sign-In Setup

Enable Google auth provider in Firebase Console:

1. Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider
3. Save changes

# cricketSim