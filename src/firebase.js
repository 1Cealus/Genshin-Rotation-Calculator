// src/firebase.js

import { initializeApp } from "firebase/app";
import { 
    getAuth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously
} from "firebase/auth";
import { 
    getFirestore,
    doc,
    setDoc,
    onSnapshot
} from "firebase/firestore";

// Import the configuration and validation flag from the new config file.
import { firebaseConfig, isFirebaseConfigValid } from './config';

// Initialize Firebase only if the config is valid.
const app = isFirebaseConfigValid ? initializeApp(firebaseConfig) : null;
const auth = isFirebaseConfigValid ? getAuth(app) : null;
const db = isFirebaseConfigValid ? getFirestore(app) : null;

// Export everything from one place for easy access in other components
export { 
    app, 
    auth, 
    db, 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    doc,
    setDoc,
    onSnapshot
};
