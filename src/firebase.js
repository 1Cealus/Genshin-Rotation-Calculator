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
    onSnapshot,
    collection,
    getDocs,
    getDoc,
    deleteDoc,
    query,
    orderBy,
    addDoc,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";


import { firebaseConfig, isFirebaseConfigValid } from './config';


const app = isFirebaseConfigValid ? initializeApp(firebaseConfig) : null;

const auth = isFirebaseConfigValid ? getAuth(app) : null;
const db = isFirebaseConfigValid ? getFirestore(app) : null;


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
    onSnapshot,
    collection,
    getDocs,
    getDoc,
    deleteDoc,
    query,
    orderBy,
    addDoc,
    Timestamp,
    updateDoc,
    where
};