import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

// Lazy initializer for Firebase Firestore on the backend Node.js server
function getFirebase(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }

  if (getApps().length > 0) {
    const app = getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  }

  let firebaseConfig: any = {};

  // Try to load from firebase-applet-config.json
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const rawData = fs.readFileSync(configPath, "utf8");
      firebaseConfig = JSON.parse(rawData);
    }
  } catch (err) {
    console.warn("Could not read firebase-applet-config.json, falling back to process.env:", err);
  }

  // Fallback to environment variables
  firebaseConfig = {
    apiKey: firebaseConfig.apiKey || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
    authDomain: firebaseConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: firebaseConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: firebaseConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: firebaseConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: firebaseConfig.appId || process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "",
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || ""
  };

  try {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId || undefined);
  } catch (e) {
    console.error("Failed to initialize Firebase Firestore:", e);
    throw new Error("Firebase initialization failed");
  }

  return dbInstance;
}

// Simplified backend-appropriate error handling
function handleFirestoreError(error: unknown, operation: string, path: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Firestore Error [${operation}] at ${path}:`, errorMessage);
  throw error;
}

/**
 * Retrieves farmer data by ID from the "farmers" collection.
 * @param farmerId The unique ID of the farmer
 */
export async function getFarmer(farmerId: string): Promise<any> {
  const path = `farmers/${farmerId}`;
  try {
    const db = getFirebase();
    const docRef = doc(db, "farmers", farmerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, "GET", path);
  }
}

/**
 * Saves farmer data by ID to the "farmers" collection.
 * @param farmerId The unique ID of the farmer
 * @param data The data object to save
 */
export async function saveFarmer(farmerId: string, data: any): Promise<void> {
  const path = `farmers/${farmerId}`;
  try {
    const db = getFirebase();
    const docRef = doc(db, "farmers", farmerId);
    await setDoc(docRef, data, {
  merge: true
});
  } catch (error) {
    handleFirestoreError(error, "WRITE", path);
  }
}
