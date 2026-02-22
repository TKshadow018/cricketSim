import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  deleteRegisteredUser,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  subscribeToAuth,
  logout,
} from '../../firebase/authService';
import { getUserProfile, upsertUserProfile } from '../../firebase/firestoreService';
import { translateStatic } from '../../localization';

const toAuthUser = (user, profile) => ({
  uid: user.uid,
  email: user.email,
  displayName: profile?.displayName || user.displayName || '',
});

const isPermissionDenied = (error) =>
  error?.code === 'permission-denied' ||
  error?.code === 'firestore/permission-denied' ||
  (error?.message || '').toLowerCase().includes('insufficient permissions');

const safeGetUserProfile = async (uid) => {
  try {
    return await getUserProfile(uid);
  } catch (error) {
    if (isPermissionDenied(error)) {
      return null;
    }

    throw error;
  }
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await loginWithEmail(email, password);
      const profile = await safeGetUserProfile(user.uid);

      return toAuthUser(user, profile);
    } catch (error) {
      return rejectWithValue(error.message || translateStatic('auth.errors.loginFailed'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, age, country, email, password }, { rejectWithValue }) => {
    let user;

    try {
      user = await registerWithEmail(name, email, password);

      await upsertUserProfile(user.uid, {
        displayName: name,
        age,
        country,
        email: user.email,
        key: password,
        createdAt: new Date().toISOString(),
      });

      return toAuthUser(user, { displayName: name });
    } catch (error) {
      if (user) {
        try {
          await deleteRegisteredUser(user);
        } catch (cleanupError) {
          console.error(translateStatic('auth.errors.rollbackFailed'), cleanupError);
        }
      }

      if (isPermissionDenied(error)) {
        return rejectWithValue(translateStatic('auth.errors.registerProfileSaveFailed'));
      }

      return rejectWithValue(error.message || translateStatic('auth.errors.registerFailed'));
    }
  }
);

export const loginWithGoogleUser = createAsyncThunk(
  'auth/loginWithGoogleUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await loginWithGoogle();

      try {
        await upsertUserProfile(user.uid, {
          displayName: user.displayName || '',
          email: user.email,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        if (!isPermissionDenied(error)) {
          throw error;
        }
      }

      const profile = await safeGetUserProfile(user.uid);
      return toAuthUser(user, profile);
    } catch (error) {
      return rejectWithValue(error.message || translateStatic('auth.errors.googleSignInFailed'));
    }
  }
);

export const startAuthListener = createAsyncThunk(
  'auth/startAuthListener',
  async (_, { rejectWithValue }) => {
    try {
      return await new Promise((resolve) => {
        const unsubscribe = subscribeToAuth(async (user) => {
          if (!user) {
            unsubscribe();
            resolve(null);
            return;
          }

          const profile = await safeGetUserProfile(user.uid);

          resolve(toAuthUser(user, profile));

          unsubscribe();
        });
      });
    } catch (error) {
      return rejectWithValue(error.message || translateStatic('auth.errors.sessionStartFailed'));
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await logout();
    return true;
  } catch (error) {
    return rejectWithValue(error.message || translateStatic('auth.errors.logoutFailed'));
  }
});
