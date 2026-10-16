
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { FarmerProfile, AnalysisRecord } from "./types";

function getDb(): Firestore {
  const apps = getApps();

  if (apps.length > 0) {
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

export function listenToFarmers(
  organizationId: string,
  callback: (farmers: FarmerProfile[]) => void
): () => void {
  if (!organizationId.trim()) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(getDb(), "farmers"),
      where("organizationId", "==", organizationId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const farmers = snapshot.docs.map(
          (document) => document.data() as FarmerProfile
        );

        farmers.sort(
          (a, b) =>
            new Date(b.lastActive || 0).getTime() -
            new Date(a.lastActive || 0).getTime()
        );

        callback(farmers);
      },
      (error) => {
        console.error("Farmer listener error:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Farmer listener setup error:", error);
    callback([]);
    return () => {};
  }
}

export function listenToAnalyses(
  organizationId: string,
  callback: (analyses: AnalysisRecord[]) => void
): () => void {
  if (!organizationId.trim()) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(getDb(), "farmers"),
      where("organizationId", "==", organizationId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const allAnalyses: AnalysisRecord[] = [];

        snapshot.docs.forEach((document) => {
          const farmer = document.data() as FarmerProfile;

          (farmer.diseases || []).forEach((disease, index) => {
            const dateTime = disease.timestamp
              ? new Date(disease.timestamp)
              : new Date();

            allAnalyses.push({
              id: `${farmer.farmerId}-${index}`,
              title: `${disease.cropType || "Unknown crop"} diagnosis`,
              date: dateTime.toISOString().split("T")[0],
              time: dateTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              cropType: disease.cropType || "Unknown",
              healthScore: disease.healthScore ?? 0,
              riskLevel: (
                disease.severity === "Severe" ||
                disease.severity === "High"
                  ? "High"
                  : disease.severity === "Moderate" ||
                      disease.severity === "Medium"
                    ? "Medium"
                    : "Low"
              ) as "Low" | "Medium" | "High",
              diagnose: disease.diagnosis || "Unknown",
              recommendations: [],
              confidence: disease.confidence ?? 0,
              status: "Completed",
            });
          });
        });

        allAnalyses.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        callback(allAnalyses);
      },
      (error) => {
        console.error("Analysis listener error:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Analysis listener setup error:", error);
    callback([]);
    return () => {};
  }
}
