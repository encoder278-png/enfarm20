
import React, { useState, useEffect } from "react";
import {
  Tab,
  ChatMessage,
  AnalysisRecord,
  Alert,
  MarketCropPrice,
  FarmSettings,
  FarmerProfile
} from "./types";

import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import AiAssistantView from "./components/AiAssistantView";
import RoverMonitoringView from "./components/RoverMonitoringView";
import AnalysisResultsView from "./components/AnalysisResultsView";
import WeatherIntelligenceView from "./components/WeatherIntelligenceView";
import MarketIntelligenceView from "./components/MarketIntelligenceView";
import RecommendationsView from "./components/RecommendationsView";
import AlertsCenterView from "./components/AlertsCenterView";
import ReportsView from "./components/ReportsView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import FarmersView from "./components/FarmersView";
import WhatsAppChatView from "./components/WhatsAppChatView";

import { listenToFarmers, listenToAnalyses } from "./firestoreService";
import { Bell, Search, CloudSun } from "lucide-react";
import { AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  // Real records loaded from Firestore
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);

  // Alerts remain empty until a real alerts source is connected
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [groundingSources, setGroundingSources] = useState<
    { title: string; uri: string }[]
  >([]);
  const [isChatGenerating, setIsChatGenerating] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);

  // Empty settings structure.
  // These are blank defaults, not real farm information.
  const [farmSettings, setFarmSettings] = useState<FarmSettings>({
    farmName: "",
    ownerName: "",
    location: "",
    farmSizeAcres: 0,
    primaryCrops: [],
    soilType: "",
    irrigationMethod: "",
    autoAlertsEnabled: false,
    apiGroundingEnabled: false
  });

  // Listen for real farmer records
  useEffect(() => {
    const unsubscribe = listenToFarmers((liveFarmers) => {
      setFarmers(liveFarmers);
    });

    return () => unsubscribe();
  }, []);

  // Listen for real assessments stored in Firestore
  useEffect(() => {
    const unsubscribe = listenToAnalyses((liveAnalyses) => {
      setAnalyses(liveAnalyses);
    });

    return () => unsubscribe();
  }, []);

  // No fabricated market prices
  const [marketPrices] = useState<MarketCropPrice[]>([]);

  // Alert actions
  const markAlertAsRead = (id: string) => {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const clearAlertLogs = () => {
    setAlerts([]);
  };

  // Save settings in the current application state.
  // Persistent settings storage still needs a Firestore connection.
  const saveFarmSettings = (newSettings: FarmSettings) => {
    setFarmSettings(newSettings);
  };

  // AI chat
  const handleSendChatMessage = async (text: string) => {
    if (isChatGenerating || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updatedHistory = [...chatHistory, userMsg];

    setChatHistory(updatedHistory);
    setIsChatGenerating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          history: updatedHistory
        })
      });

      if (!response.ok) {
        throw new Error("Chat API request failed");
      }

      const data = await response.json();

      const apiResponseMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: data.text || "No response was returned.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      setChatHistory((previous) => [...previous, apiResponseMsg]);

      if (Array.isArray(data.groundingSources)) {
        setGroundingSources(data.groundingSources);
      }
    } catch (error) {
      console.error("Chat request failed:", error);

      const errorMessage: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: "Samahani, huduma ya AI haipatikani sasa hivi. Tafadhali jaribu tena baadaye.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      setChatHistory((previous) => [...previous, errorMessage]);
    } finally {
      setIsChatGenerating(false);
    }
  };

  const unreadAlertsCount = alerts.filter((alert) => !alert.read).length;

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-100 font-sans overflow-hidden select-none">

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadAlertsCount={unreadAlertsCount}
        farmSettings={farmSettings}
      />

      {/* Main application panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Header */}
        <header className="h-19 shrink-0 bg-[#0d131f] border-b border-slate-800/50 px-6 flex items-center justify-between gap-6 select-none z-10 w-full">

          <div className="relative w-96 hidden sm:block">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />

            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#151c28] border border-slate-800/80 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-800 transition-all cursor-text font-sans"
              id="global-search-entry"
            />
          </div>

          <div className="flex items-center gap-4.5 ml-auto">

            {/* Notifications */}
            <button
              id="top-notification-bell"
              onClick={() => setActiveTab(Tab.ALERTS_CENTER)}
              className="relative w-10 h-10 rounded-xl bg-[#151c28] border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Open alerts"
            >
              <Bell className="w-4.5 h-4.5" />

              {unreadAlertsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Weather status: no invented readings */}
            <button
              onClick={() => setActiveTab(Tab.WEATHER_INTELLIGENCE)}
              className="bg-[#151c28] border border-slate-800/80 hover:border-slate-700/80 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all"
            >
              <CloudSun className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">
                Weather unavailable
              </span>
            </button>

          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 min-h-0 bg-[#0b0e14] relative overflow-hidden">
          <AnimatePresence mode="wait">

            {activeTab === Tab.DASHBOARD && (
              <DashboardView
                setActiveTab={setActiveTab}
                farmers={farmers}
                analyses={analyses}
                alerts={alerts}
              />
            )}

            {activeTab === Tab.AI_ASSISTANT && (
              <AiAssistantView
                chatHistory={chatHistory}
                onSendMessage={handleSendChatMessage}
                isGenerating={isChatGenerating}
                groundingSources={groundingSources}
              />
            )}

            {activeTab === Tab.UPLOAD_ANALYSIS && (
              <RoverMonitoringView />
            )}

            {activeTab === Tab.ANALYSIS_RESULTS && (
              <AnalysisResultsView
                analyses={analyses}
                selectedId={selectedAnalysisId}
                onSelectId={setSelectedAnalysisId}
                setActiveTab={setActiveTab}
              />
            )}
            
{activeTab === Tab.REPORTS && (
  <ReportsView
    analyses={analyses}
    farmers={farmers}
    onSelectAnalysis={(record) => {
      setSelectedAnalysisId(record.id);
      setActiveTab(Tab.ANALYSIS_RESULTS);
    }}
  />
)}


            {activeTab === Tab.WEATHER_INTELLIGENCE && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                  <CloudSun className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-white">
                    Weather data unavailable
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Weather information will appear here when a live weather
                    data connection is available.
                  </p>
                </div>
              </div>
            )}

            {activeTab === Tab.MARKET_INTELLIGENCE && (
              marketPrices.length > 0 ? (
                <MarketIntelligenceView prices={marketPrices} />
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="max-w-md text-center">
                    <h2 className="text-lg font-semibold text-white">
                      Market data unavailable
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">
                      No verified market prices have been connected yet.
                    </p>
                  </div>
                </div>
              )
            )}

            {activeTab === Tab.AI_RECOMMENDATIONS && (
              <RecommendationsView key={Tab.AI_RECOMMENDATIONS} />
            )}

            {activeTab === Tab.ALERTS_CENTER && (
              <AlertsCenterView
                alerts={alerts}
                onMarkRead={markAlertAsRead}
                onClearAll={clearAlertLogs}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === Tab.HISTORY && (
              <HistoryView
                analyses={analyses}
                onSelectAnalysis={(record) => {
                  setSelectedAnalysisId(record.id);
                  setActiveTab(Tab.ANALYSIS_RESULTS);
                }}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === Tab.SETTINGS && (
              <SettingsView
                settings={farmSettings}
                onSaveSettings={saveFarmSettings}
              />
            )}

            {activeTab === Tab.FARMERS && (
              <FarmersView
                farmers={farmers}
                onOpenChat={(farmer) => {
                  setSelectedFarmer(farmer);
                  setActiveTab(Tab.WHATSAPP_CHAT);
                }}
              />
            )}

            {activeTab === Tab.WHATSAPP_CHAT && (
              <WhatsAppChatView
                farmers={farmers}
                selectedFarmer={selectedFarmer}
                onSelectFarmer={setSelectedFarmer}
              />
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
