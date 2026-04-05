import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5CNY7XRE9kGs4pZHXj7t51owtflQUJ6I",
  authDomain: "woo-home-1c9d2.firebaseapp.com",
  projectId: "woo-home-1c9d2",
  storageBucket: "woo-home-1c9d2.firebasestorage.app",
  messagingSenderId: "21970336841",
  appId: "1:21970336841:web:233a662e2f78e56e9ed398",
  measurementId: "G-V9YGE512VP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

const DOC_ID = "shared_plan";
const COLLECTION = "calculator_data";

export const saveCalculatorData = async (data) => {
  try {
    await setDoc(doc(db, COLLECTION, DOC_ID), {
      data: JSON.stringify(data),
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Save error:", e);
  }
};

export const loadCalculatorData = async () => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (snap.exists()) {
      return JSON.parse(snap.data().data);
    }
  } catch (e) {
    console.error("Load error:", e);
  }
  return null;
};

export const subscribeToData = (callback) => {
  return onSnapshot(doc(db, COLLECTION, DOC_ID), (snap) => {
    if (snap.exists()) {
      try {
        callback(JSON.parse(snap.data().data));
      } catch (e) {
        console.error("Parse error:", e);
      }
    }
  });
};
