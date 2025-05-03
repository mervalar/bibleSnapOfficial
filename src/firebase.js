import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Add enableIndexedDbPersistence

const firebaseConfig = {
  apiKey: "AIzaSyCwft6R8S4y5r7VOZtfEVDiXPbHzStrPZI",
  authDomain: "biblesnap-728a8.firebaseapp.com",
  projectId: "biblesnap-728a8",
  storageBucket: "biblesnap-728a8.firebasestorage.app",
  messagingSenderId: "689137632827",
  appId: "1:689137632827:web:edbaa5f40f272b225bbe1e",
  measurementId: "G-JWGR0RRNCB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a time.
    console.warn("Offline persistence is already enabled in another tab.");
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the
    // features required to enable persistence
    console.warn("Current browser does not support offline persistence.");
  }
});

export { auth, db, signInAnonymously };