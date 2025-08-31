// src/services/authService.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Sign in with email
export const loginWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Register new user
export const registerWithEmail = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

// Sign out
export const logout = async () => {
  return await signOut(auth);
};

// Watch auth state
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
