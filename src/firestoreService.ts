
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  type Firestore,
} from "firebase/firestore";

import type { FarmerProfile, AnalysisRecord } from "./types";

// Initialize Firebase
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

// Safely parse timestamps without inventing dates.
function parseTimestamp(timestamp: string | undefined): Date | null {
  if (!timestamp || typeof timestamp !== "string") {
    return null;
  }

  const parsed = new Date(timestamp);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Format dates using the browser's local timezone.
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Listen to all farmers.
export function listenToFarmers(
  callback: (farmers: FarmerProfile[]) => void
): () => void {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"));

    return onSnapshot(
      q,
      (snapshot) => {
        const farmers: FarmerProfile[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            ...data,
            farmerId:
              typeof data.farmerId === "string" && data.farmerId
                ? data.farmerId
                : doc.id,
          } as FarmerProfile;
        });

        farmers.sort((a, b) => {
          const dateA = parseTimestamp(a.lastActive)?.getTime() ?? 0;
          const dateB = parseTimestamp(b.lastActive)?.getTime() ?? 0;

          return dateB - dateA;
        });

        callback(farmers);
      },
      (err) => {
        console.error("Firestore farmers listener error:", err);

        // Preserve the existing UI state.
        // An error must not look like an empty farmer collection.
      }
    );
  } catch (err) {
    console.error("Firestore farmers initialization error:", err);
    return () => {};
  }
}

// Listen to assessments saved inside each farmer's diseases array.
export function listenToAnalyses(
  callback: (analyses: AnalysisRecord[]) => void
): () => void {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"));

    return onSnapshot(
      q,
      (snapshot) => {
        const allAnalyses: {
          record: AnalysisRecord;
          timestampMs: number;
        }[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          const farmerId =
            typeof data.farmerId === "string" && data.farmerId
              ? data.farmerId
              : doc.id;

          const diseases = Array.isArray(data.diseases)
            ? data.diseases
            : [];

          diseases.forEach((d, index) => {
            if (!d || typeof d !== "object") {
              return;
            }

            const timestamp =
              typeof d.timestamp === "string"
                ? parseTimestamp(d.timestamp)
                : null;

            const timestampMs = timestamp?.getTime() ?? 0;

            const date = timestamp
              ? formatDate(timestamp)
              : "Unknown";

            const time = timestamp
              ? formatTime(timestamp)
              : "Unknown";

            const severity =
              typeof d.severity === "string"
                ? d.severity.toLowerCase()
                : "";

            let riskLevel: AnalysisRecord["riskLevel"] = "Unknown";

            if (severity === "severe" || severity === "high") {
              riskLevel = "High";
            } else if (
              severity === "moderate" ||
              severity === "medium"
            ) {
              riskLevel = "Medium";
            } else if (
              severity === "low" ||
              severity === "mild"
            ) {
              riskLevel = "Low";
            }

            const id =
              typeof d.id === "string" && d.id
                ? d.id
                : `${farmerId}-${d.timestamp || "no-timestamp"}-${index}`;

            const healthScore =
              typeof d.healthScore === "number" &&
              Number.isFinite(d.healthScore)
                ? d.healthScore
                : null;

            const confidence =
              typeof d.confidence === "number" &&
              Number.isFinite(d.confidence)
                ? d.confidence
                : null;

            const recommendations = Array.isArray(d.recommendations)
              ? d.recommendations.filter(
                  (item: unknown): item is string =>
                    typeof item === "string" && item.trim().length > 0
                )
              : [];

            const record: AnalysisRecord = {
              id,
              farmerId,
              source:
                typeof d.source === "string" ? d.source : undefined,

              title: `${d.cropType || "Unknown crop"} assessment`,
              date,
              time,

              cropType:
                typeof d.cropType === "string" && d.cropType
                  ? d.cropType
                  : "Unknown",

              healthScore,
              riskLevel,

              diagnose:
                typeof d.diagnosis === "string" && d.diagnosis
                  ? d.diagnosis
                  : "No diagnosis recorded",

              recommendations,

              imageUrl:
                typeof d.imageUrl === "string"
                  ? d.imageUrl
                  : undefined,

              confidence,
              status: "Completed",
            };

            allAnalyses.push({
              record,
              timestampMs,
            });
          });
        });

        // Sort by the complete original timestamp.
        // Records without timestamps appear last.
        allAnalyses.sort((a, b) => {
          return b.timestampMs - a.timestampMs;
        });

        callback(allAnalyses.map((item) => item.record));
      },
      (err) => {
        console.error("Firestore analyses listener error:", err);

        // Do not replace existing assessments with an empty array
        // when Firestore reports an error.
      }
    );
  } catch (err) {
    console.error("Firestore analyses initialization error:", err);
    return () => {};
  }
}
