import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '@/types';

export interface AuthUser extends FirebaseUser {
  role?: UserRole;
  isAdmin?: boolean;
}

export const signInAnonymously_Client = async (): Promise<UserCredential> => {
  try {
    const result = await signInAnonymously(auth);

    // Create user document if it doesn't exist
    const userDocRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const userData: Omit<User, 'uid'> = {
        roleClaims: {},
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(userDocRef, userData);
    }

    return result;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Get user document to check admin status
    const userDocRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User not found in database');
    }

    return result;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

export const getCurrentUser = (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        // Get user document to check role
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        const authUser: AuthUser = {
          ...user,
          role: 'participant',
          isAdmin: false,
        };

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          authUser.isAdmin = userData.roleClaims.admin === true;
          authUser.role = authUser.isAdmin ? 'admin' : 'participant';
        }

        resolve(authUser);
      } catch (error) {
        console.error('Error getting user data:', error);
        resolve({
          ...user,
          role: 'participant',
          isAdmin: false,
        });
      }
    });
  });
};

export const checkUserRole = async (uid: string): Promise<UserRole> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return userData.roleClaims.admin === true ? 'admin' : 'participant';
    }

    return 'participant';
  } catch (error) {
    console.error('Error checking user role:', error);
    return 'participant';
  }
};