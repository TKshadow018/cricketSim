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
import { isDebugAuthBypassEnabled } from '../utils/runtimeFlags';
import { db } from './config';

const usersCollection = 'users';
const gameSavesCollection = 'gameSaves';
const matchHistoryCollection = 'matchHistory';
const careerSavesCollection = 'careerSaves';
const careerSeasonHistoryCollection = 'careerSeasonHistory';
const autoSaveId = 'autosave';
const careerAutoSaveId = 'career-autosave';
const minHistoryLimit = 1;
const maxHistoryLimit = 25;
const maxManualGameSaves = 5;
const maxCareerSaves = 10;
// Query one extra save because the autosave entry shares the same collection but is not counted as a manual save.
const gameSavesQueryLimit = maxManualGameSaves + 1;
const debugStorageKey = 'cricket-sim-debug-storage';
const shouldUseDebugStorage = () => isDebugAuthBypassEnabled;

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
    return parsed &&
      typeof parsed === 'object' &&
      parsed.users &&
      typeof parsed.users === 'object' &&
      !Array.isArray(parsed.users)
      ? parsed
      : createEmptyDebugStore();
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
  const nextStore = store?.users && typeof store.users === 'object' && !Array.isArray(store.users)
    ? store
    : createEmptyDebugStore();
  const safeUid = String(uid || '').trim();

  if (!safeUid) {
    return { store: nextStore, userStore: null };
  }

  if (!nextStore.users[safeUid]) {
    nextStore.users[safeUid] = {
      profile: null,
      [gameSavesCollection]: {},
      [matchHistoryCollection]: {},
      [careerSavesCollection]: {},
      [careerSeasonHistoryCollection]: {},
    };
  }

  nextStore.users[safeUid][gameSavesCollection] = nextStore.users[safeUid][gameSavesCollection] || {};
  nextStore.users[safeUid][matchHistoryCollection] = nextStore.users[safeUid][matchHistoryCollection] || {};
  nextStore.users[safeUid][careerSavesCollection] = nextStore.users[safeUid][careerSavesCollection] || {};
  nextStore.users[safeUid][careerSeasonHistoryCollection] =
    nextStore.users[safeUid][careerSeasonHistoryCollection] || {};

  return {
    store: nextStore,
    userStore: nextStore.users[safeUid],
  };
};

const toDebugTimestamp = () => new Date().toISOString();

const getUpdatedAtTime = (item) => {
  const parsed = Date.parse(item?.updatedAt || '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortByUpdatedAtDesc = (items) =>
  [...items].sort((left, right) => getUpdatedAtTime(right) - getUpdatedAtTime(left));

const createDebugId = (() => {
  let counter = 0;

  return () => {
    counter += 1;
    return `debug-${Date.now().toString(36)}-${counter.toString(36)}`;
  };
})();

export const getUserProfile = async (uid) => {
  if (shouldUseDebugStorage()) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return userStore?.profile || null;
  }

  const userRef = doc(db, usersCollection, uid);
  const userDoc = await getDoc(userRef);

  return userDoc.exists() ? userDoc.data() : null;
};

export const upsertUserProfile = async (uid, data) => {
  if (shouldUseDebugStorage()) {
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

const mapCareerAutoSave = (save) =>
  save
    ? {
        ...save,
        id: careerAutoSaveId,
        storageId: save.storageId || save.id || autoSaveId,
        sourceCollection: careerSavesCollection,
      }
    : null;

const mapCareerSave = (save) =>
  save
    ? {
        ...save,
        storageId: save.storageId || save.id,
        sourceCollection: careerSavesCollection,
      }
    : null;

export const listGameSaves = async (uid) => {
  if (shouldUseDebugStorage()) {
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
  if (shouldUseDebugStorage()) {
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
  if (shouldUseDebugStorage()) {
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
  if (shouldUseDebugStorage()) {
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
  if (shouldUseDebugStorage()) {
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
  if (shouldUseDebugStorage()) {
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

  if (shouldUseDebugStorage()) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return sortByUpdatedAtDesc(Object.values(userStore?.[matchHistoryCollection] || {})).slice(0, safeLimit);
  }

  const historyRef = collection(db, usersCollection, uid, matchHistoryCollection);
  const historyQuery = query(historyRef, orderBy('updatedAt', 'desc'), limit(safeLimit));
  const result = await getDocs(historyQuery);
  return result.docs.map(mapSaveDoc);
};

export const listCareerSaves = async (uid) => {
  if (shouldUseDebugStorage()) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return sortByUpdatedAtDesc(Object.values(userStore?.[careerSavesCollection] || {}))
      .filter((save) => save.id !== autoSaveId)
      .map(mapCareerSave)
      .slice(0, maxCareerSaves);
  }

  const savesRef = collection(db, usersCollection, uid, careerSavesCollection);
  const savesQuery = query(savesRef, orderBy('updatedAt', 'desc'), limit(maxCareerSaves));
  const result = await getDocs(savesQuery);
  return result.docs.map(mapSaveDoc).filter((save) => save.id !== autoSaveId).map(mapCareerSave);
};

export const createCareerSave = async (uid, payload) => {
  if (shouldUseDebugStorage()) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return null;
    }

    const id = createDebugId();
    const timestamp = toDebugTimestamp();
    userStore[careerSavesCollection][id] = {
      id,
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeDebugStore(store);
    return { id };
  }

  const savesRef = collection(db, usersCollection, uid, careerSavesCollection);
  return addDoc(savesRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const removeCareerSave = async (uid, saveId) => {
  if (shouldUseDebugStorage()) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return;
    }

    delete userStore[careerSavesCollection][saveId];
    writeDebugStore(store);
    return;
  }

  const saveRef = doc(db, usersCollection, uid, careerSavesCollection, saveId);
  await deleteDoc(saveRef);
};

export const getCareerAutoSave = async (uid) => {
  if (shouldUseDebugStorage()) {
    const { userStore } = getDebugUserStore(readDebugStore(), uid);
    return mapCareerAutoSave(userStore?.[careerSavesCollection]?.[autoSaveId] || null);
  }

  const saveRef = doc(db, usersCollection, uid, careerSavesCollection, autoSaveId);
  const saveDoc = await getDoc(saveRef);
  if (!saveDoc.exists()) {
    return null;
  }

  return mapCareerAutoSave(mapSaveDoc(saveDoc));
};

export const upsertCareerAutoSave = async (uid, payload) => {
  if (shouldUseDebugStorage()) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return;
    }

    const existing = userStore[careerSavesCollection][autoSaveId];
    userStore[careerSavesCollection][autoSaveId] = {
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

  const saveRef = doc(db, usersCollection, uid, careerSavesCollection, autoSaveId);
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

export const saveCareerSeasonHistory = async (uid, payload) => {
  if (shouldUseDebugStorage()) {
    const { store, userStore } = getDebugUserStore(readDebugStore(), uid);
    if (!userStore) {
      return null;
    }

    const id = createDebugId();
    userStore[careerSeasonHistoryCollection][id] = {
      id,
      ...payload,
      createdAt: toDebugTimestamp(),
    };
    writeDebugStore(store);
    return { id };
  }

  const historyRef = collection(db, usersCollection, uid, careerSeasonHistoryCollection);
  return addDoc(historyRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });
};
