import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './config';

const usersCollection = 'users';

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
