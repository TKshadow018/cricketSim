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
import { db } from './config';

const usersCollection = 'users';
const gameSavesCollection = 'gameSaves';
const matchHistoryCollection = 'matchHistory';
const autoSaveId = 'autosave';

export const getUserProfile = async (uid) => {
  const userRef = doc(db, usersCollection, uid);
  const userDoc = await getDoc(userRef);

  return userDoc.exists() ? userDoc.data() : null;
};

export const upsertUserProfile = async (uid, data) => {
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
  const savesRef = collection(db, usersCollection, uid, gameSavesCollection);
  const savesQuery = query(savesRef, orderBy('updatedAt', 'desc'), limit(6));
  const result = await getDocs(savesQuery);
  return result.docs.map(mapSaveDoc).filter((save) => save.id !== autoSaveId).slice(0, 5);
};

export const createGameSave = async (uid, payload) => {
  const savesRef = collection(db, usersCollection, uid, gameSavesCollection);
  return addDoc(savesRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const removeGameSave = async (uid, saveId) => {
  const saveRef = doc(db, usersCollection, uid, gameSavesCollection, saveId);
  await deleteDoc(saveRef);
};

export const getAutoGameSave = async (uid) => {
  const saveRef = doc(db, usersCollection, uid, gameSavesCollection, autoSaveId);
  const saveDoc = await getDoc(saveRef);
  if (!saveDoc.exists()) {
    return null;
  }

  return mapSaveDoc(saveDoc);
};

export const upsertAutoGameSave = async (uid, payload) => {
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
  const historyRef = collection(db, usersCollection, uid, matchHistoryCollection);
  return addDoc(historyRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const listRecentMatchHistory = async (uid, maxEntries = 10) => {
  const safeLimit = Math.max(1, Math.min(25, Number(maxEntries) || 10));
  const historyRef = collection(db, usersCollection, uid, matchHistoryCollection);
  const historyQuery = query(historyRef, orderBy('updatedAt', 'desc'), limit(safeLimit));
  const result = await getDocs(historyQuery);
  return result.docs.map(mapSaveDoc);
};
