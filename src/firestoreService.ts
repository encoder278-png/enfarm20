import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  type Firestore
} from "firebase/firestore";
import { FarmerProfile } from "./types";

// ── Initialize Firebase for the FRONTEND ─────────────────────────────────
// This uses your VITE_ environment variables which are safe for the browser.
// These are different from your backend variables in memoryService.ts.
function getDb(): Firestore {
  if (getApps().length > 0) {
    return getFirestore(getApp());
  }
  const app = initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  });
  return getFirestore(app);
}

// ── Listen to ALL farmers in real time ────────────────────────────────────
// This is a LIVE listener. Every time a farmer sends a WhatsApp message
// and gets saved to Firestore by your server, this fires automatically
// and updates your admin panel without any refresh.
//
// Returns an unsubscribe function — call it when the component unmounts.
export function listenToFarmers(
  callback: (farmers: FarmerProfile[]) => void
): () => void {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const farmers = snapshot.docs.map((d) => d.data() as FarmerProfile);
        // Sort by lastActive — most recent first
        farmers.sort((a, b) =>
          new Date(b.lastActive || 0).getTime() -
          new Date(a.lastActive || 0).getTime()
        );
        callback(farmers);
      },
      (err) => {
        console.error("Firestore listener error:", err);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("Firestore init error:", err);
    callback([]);
    return () => {};
  }
}