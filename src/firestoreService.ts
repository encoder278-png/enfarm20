
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  type Firestore
} from "firebase/firestore";
import { FarmerProfile, AnalysisRecord } from "./types";

// Initialize Firebase for the frontend
function getDb(): Firestore {
  if (getApps().length > 0) {
    return getFirestore(getApp());
  }

  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

  return getFirestore(app);
}

// Safely parse a timestamp without inventing a date
function parseTimestamp(timestamp: string | undefined): Date | null {
  if (!timestamp) return null;

  const parsed = new Date(timestamp);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Listen to all farmers
export function listenToFarmers(
  callback: (farmers: FarmerProfile[]) => void
): () => void {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"));

    return onSnapshot(
      q,
      (snapshot) => {
        const farmers = snapshot.docs.map(
          (doc) => doc.data() as FarmerProfile
        );

        farmers.sort((a, b) => {
          const dateA = parseTimestamp(a.lastActive)?.getTime() ?? 0;
          const dateB = parseTimestamp(b.lastActive)?.getTime() ?? 0;
          return dateB - dateA;
        });

        callback(farmers);
      },
      (err) => {
        console.error("Firestore farmers listener error:", err);
        callback([]);
      }
    );
  } catch (err) {
    console.error("Firestore initialization error:", err);
    callback([]);
    return () => {};
  }
}

// Listen to assessments saved inside each farmer's diseases array
export function listenToAnalyses(
  callback: (analyses: AnalysisRecord[]) => void
): () => void {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"));

    return onSnapshot(
      q,
      (snapshot) => {
        const allAnalyses: AnalysisRecord[] = [];

        snapshot.docs.forEach((doc) => {
          const farmer = doc.data() as FarmerProfile;

          (farmer.diseases || []).forEach((d, index) => {
            const timestamp = parseTimestamp(d.timestamp);

            // Do not invent a date or time when the timestamp is missing.
            const date = timestamp
              ? timestamp.toISOString().split("T")[0]
              : "Unknown";

            const time = timestamp
              ? timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Unknown";

            const severity = (d.severity || "").toLowerCase();

            let riskLevel: AnalysisRecord["riskLevel"] = "Unknown";

            if (severity === "severe" || severity === "high") {
              riskLevel = "High";
            } else if (
              severity === "moderate" ||
              severity === "medium"
            ) {
              riskLevel = "Medium";
            } else if (severity === "low" || severity === "mild") {
              riskLevel = "Low";
            }

            const id =
              d.id ||
              `${farmer.farmerId}-${d.timestamp || "no-timestamp"}-${index}`;

            allAnalyses.push({
              id,
              farmerId: farmer.farmerId,
              source: d.source,

              title: `${d.cropType || "Unknown crop"} assessment`,
              date,
              time,

              cropType: d.cropType || "Unknown",
              healthScore: d.healthScore ?? null,
              riskLevel,

              diagnose: d.diagnosis || "No diagnosis recorded",

              recommendations: Array.isArray(d.recommendations)
                ? d.recommendations
                : [],

              imageUrl: d.imageUrl,

              confidence: d.confidence ?? null,
              status: "Completed",
            });
          });
        });

        // Sort valid timestamps first, newest to oldest.
        allAnalyses.sort((a, b) => {
          const dateA = parseTimestamp(
            a.date === "Unknown" ? undefined : a.date
          )?.getTime() ?? 0;

          const dateB = parseTimestamp(
            b.date === "Unknown" ? undefined : b.date
          )?.getTime() ?? 0;

          return dateB - dateA;
        });

        callback(allAnalyses);
      },
      (err) => {
        console.error("Firestore analyses listener error:", err);
        callback([]);
      }
    );
  } catch (err) {
    console.error("Firestore initialization error:", err);
    callback([]);
    return () => {};
  }
}
