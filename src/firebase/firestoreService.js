import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { isDebugMode } from '../config/runtimeConfig';
import { db } from './config';

const usersCollection = 'users';
const gameSavesCollection = 'gameSaves';
const matchHistoryCollection = 'matchHistory';
const autoSaveId = 'autosave';
const minHistoryLimit = 1;
const maxHistoryLimit = 25;
const maxManualGameSaves = 5;
// Query one extra save because the autosave document shares the same collection but is not counted as a manual save.
const gameSavesQueryLimit = maxManualGameSaves + 1;
const debugStorageKey = 'cricket-sim-debug-storage';

const createEmptyDebugStore = () => ({ users: {} });
const normalizeHistoryLimit = (maxEntries = 10) =>
  Math.max(minHistoryLimit, Math.min(maxHistoryLimit, Number(maxEntries) || 10));

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readDebugStore = () => {
  if (!canUseLocalStorage()) {
    return createEmptyDebugStore();
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(debugStorageKey) || '{}');
    return parsed && typeof parsed === 'object' && parsed.users ? parsed : createEmptyDebugStore();
  } catch {
    return createEmptyDebugStore();
  }
};

const writeDebugStore = (store) => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(debugStorageKey, JSON.stringify(store));
};

const getDebugUserStore = (store, uid) => {
  const nextStore = store?.users ? store : createEmptyDebugStore();
  const safeUid = String(uid || '').trim();

  if (!safeUid) {
    return { store: nextStore, userStore: null };
  }

  if (!nextStore.users[safeUid]) {
    nextStore.users[safeUid] = {
      profile: null,
      [gameSavesCollection]: {},
      [matchHistoryCollection]: {},
    };
  }

  return {
    store: nextStore,
    userStore: nextStore.users[safeUid],
  };
};

const toDebugTimestamp = () => new Date().toISOString();

const sortByUpdatedAtDesc = (items) =>
  [...items].sort(
    (left, right) => new Date(right?.updatedAt || 0).getTime() - new Date(left?.updatedAt || 0).getTime()
  );

const createDebugId = (() => {
  let counter = 0;

  return () => {
    counter += 1;
    return `debug-${Date.now().toString(36)}-${counter.toString(36)}`;
  };
})();

export const getUserProfile = async (uid) => {
  if (isDebugMode) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return userStore?.profile || null;
  }

  const userRef = doc(db, usersCollection, uid);
  const userDoc = await getDoc(userRef);

  return userDoc.exists() ? userDoc.data() : null;
};

export const upsertUserProfile = async (uid, data) => {
  if (isDebugMode) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return;
    }

    userStore.profile = {
      ...(userStore.profile || {}),
      ...data,
      updatedAt: toDebugTimestamp(),
    };
    writeDebugStore(store);
    return;
  }

  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

const mapSaveDoc = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
});

export const listGameSaves = async (uid) => {
  if (isDebugMode) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return sortByUpdatedAtDesc(Object.values(userStore?.[gameSavesCollection] || {}))
      .filter((save) => save.id !== autoSaveId)
      .slice(0, maxManualGameSaves);
  }

  const savesRef = collection(db, usersCollection, uid, gameSavesCollection);
  const savesQuery = query(savesRef, orderBy('updatedAt', 'desc'), limit(gameSavesQueryLimit));
  const result = await getDocs(savesQuery);
  return result.docs.map(mapSaveDoc).filter((save) => save.id !== autoSaveId).slice(0, maxManualGameSaves);
};

export const createGameSave = async (uid, payload) => {
  if (isDebugMode) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return null;
    }

    const id = createDebugId();
    const timestamp = toDebugTimestamp();
    userStore[gameSavesCollection][id] = {
      id,
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeDebugStore(store);
    return { id };
  }

  const savesRef = collection(db, usersCollection, uid, gameSavesCollection);
  return addDoc(savesRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const removeGameSave = async (uid, saveId) => {
  if (isDebugMode) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return;
    }

    delete userStore[gameSavesCollection][saveId];
    writeDebugStore(store);
    return;
  }

  const saveRef = doc(db, usersCollection, uid, gameSavesCollection, saveId);
  await deleteDoc(saveRef);
};

export const getAutoGameSave = async (uid) => {
  if (isDebugMode) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return userStore?.[gameSavesCollection]?.[autoSaveId] || null;
  }

  const saveRef = doc(db, usersCollection, uid, gameSavesCollection, autoSaveId);
  const saveDoc = await getDoc(saveRef);
  if (!saveDoc.exists()) {
    return null;
  }

  return mapSaveDoc(saveDoc);
};

export const upsertAutoGameSave = async (uid, payload) => {
  if (isDebugMode) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return;
    }

    const existing = userStore[gameSavesCollection][autoSaveId];
    userStore[gameSavesCollection][autoSaveId] = {
      id: autoSaveId,
      ...existing,
      ...payload,
      isAutoSave: true,
      createdAt: existing?.createdAt || toDebugTimestamp(),
      updatedAt: toDebugTimestamp(),
    };
    writeDebugStore(store);
    return;
  }

  const saveRef = doc(db, usersCollection, uid, gameSavesCollection, autoSaveId);
  await setDoc(
    saveRef,
    {
      ...payload,
      isAutoSave: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const createMatchHistoryEntry = async (uid, payload) => {
  if (isDebugMode) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return null;
    }

    const id = createDebugId();
    const timestamp = toDebugTimestamp();
    userStore[matchHistoryCollection][id] = {
      id,
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeDebugStore(store);
    return { id };
  }

  const historyRef = collection(db, usersCollection, uid, matchHistoryCollection);
  return addDoc(historyRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const listRecentMatchHistory = async (uid, maxEntries = 10) => {
  const safeLimit = normalizeHistoryLimit(maxEntries);

  if (isDebugMode) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return sortByUpdatedAtDesc(Object.values(userStore?.[matchHistoryCollection] || {})).slice(0, safeLimit);
  }

  const historyRef = collection(db, usersCollection, uid, matchHistoryCollection);
  const historyQuery = query(historyRef, orderBy('updatedAt', 'desc'), limit(safeLimit));
  const result = await getDocs(historyQuery);
  return result.docs.map(mapSaveDoc);
};
