import React, { useState, useEffect } from "react";
import { Tab, ChatMessage, AnalysisRecord, Alert, WeatherData, MarketCropPrice, FarmSettings, FarmerProfile } from "./types";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import AiAssistantView from "./components/AiAssistantView";
import UploadAnalysisView from "./components/UploadAnalysisView";
import AnalysisResultsView from "./components/AnalysisResultsView";
import WeatherIntelligenceView from "./components/WeatherIntelligenceView";
import MarketIntelligenceView from "./components/MarketIntelligenceView";
import RecommendationsView from "./components/RecommendationsView";
import AlertsCenterView from "./components/AlertsCenterView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import FarmersView from "./components/FarmersView";
import WhatsAppChatView from "./components/WhatsAppChatView";
import { listenToFarmers, listenToAnalyses } from "./firestoreService";
import { Bell, Search, Sun, SunDim, ChevronDown, Leaf, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  
  // Simulated initial analysis records with exact picture naming representation: Data Analyse 1-4
    const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);

  // Initial Threat Alerts logs matching picture details
 const [alerts, setAlerts] = useState<Alert[]>([]);

  // Chat conversation logs
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([]);
  const [isChatGenerating, setIsChatGenerating] = useState(false);

  // Crop Upload variables
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);

  // Connect to Firestore and listen for real farmer data
  // Every time a farmer messages on WhatsApp, this updates automatically
  useEffect(() => {
  const unsubscribe = listenToFarmers((liveFarmers) => {
    setFarmers(liveFarmers);
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsubscribe = listenToAnalyses((liveAnalyses) => {
    setAnalyses(liveAnalyses);
  });
  return () => unsubscribe();
}, []);
  // Weather index structure
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 24,
    humidity: 48,
    soilMoisture: 65,
    condition: "Sunny",
    windSpeed: 8,
    precipitation: 0.1,
    uvIndex: 6,
    weeklyForecast: [
      { day: "Sun", temp: 21, humidity: 44, condition: "Sunny" },
      { day: "Mon", temp: 23, humidity: 46, condition: "Sunny" },
      { day: "Tue", temp: 22, humidity: 50, condition: "Partly Cloudy" },
      { day: "Wed", temp: 24, humidity: 48, condition: "Sunny" },
      { day: "Thu", temp: 25, humidity: 42, condition: "Sunny" },
      { day: "Fri", temp: 26, humidity: 40, condition: "Sunny" },
      { day: "Sat", temp: 24, humidity: 45, condition: "Sunny" }
    ]
  });

  // Target prices indexes
  const [marketPrices, setMarketPrices] = useState<MarketCropPrice[]>([
  {
    id: "mahindi",
    name: "Mahindi",
    price: 450,
    currency: "TZS",
    unit: "kg",
    changePercent: 2.1,
    trend: "up",
    history: [
      { date: "Wiki 1", value: 420 },
      { date: "Wiki 2", value: 430 },
      { date: "Wiki 3", value: 440 },
      { date: "Wiki 4", value: 450 }
    ],
    marketCap: "Soko la Arusha",
    volume24h: "Tani 850"
  },
  {
    id: "muhogo",
    name: "Muhogo",
    price: 280,
    currency: "TZS",
    unit: "kg",
    changePercent: -1.2,
    trend: "down",
    history: [
      { date: "Wiki 1", value: 300 },
      { date: "Wiki 2", value: 295 },
      { date: "Wiki 3", value: 285 },
      { date: "Wiki 4", value: 280 }
    ],
    marketCap: "Soko la Dar es Salaam",
    volume24h: "Tani 620"
  },
  {
    id: "maharage",
    name: "Maharage",
    price: 1800,
    currency: "TZS",
    unit: "kg",
    changePercent: 0.8,
    trend: "stable",
    history: [
      { date: "Wiki 1", value: 1750 },
      { date: "Wiki 2", value: 1770 },
      { date: "Wiki 3", value: 1790 },
      { date: "Wiki 4", value: 1800 }
    ],
    marketCap: "Soko la Moshi",
    volume24h: "Tani 310"
  },
  {
    id: "mpunga",
    name: "Mpunga",
    price: 950,
    currency: "TZS",
    unit: "kg",
    changePercent: 1.5,
    trend: "up",
    history: [
      { date: "Wiki 1", value: 900 },
      { date: "Wiki 2", value: 920 },
      { date: "Wiki 3", value: 935 },
      { date: "Wiki 4", value: 950 }
    ],
    marketCap: "Soko la Morogoro",
    volume24h: "Tani 480"
  }
]);

  // Farm Settings demographic constants
  const [farmSettings, setFarmSettings] = useState<FarmSettings>({
  farmName: "Shamba la EnFarm",
  ownerName: "Mkulima",
  location: "Kilimanjaro, Tanzania",
  farmSizeAcres: 2,
  primaryCrops: ["Mahindi", "Maharage", "Muhogo"],
  soilType: "Udongo wa Volkano",
  irrigationMethod: "Umwagiliaji wa Mikono",
  autoAlertsEnabled: true,
  apiGroundingEnabled: true
});

  // Action: Addressed alerts triggers
  const markAlertAsRead = (id: string) => {
    setAlerts(alerts.map((a: Alert) => (a.id === id ? { ...a, read: true } : a)));
  };

  const clearAlertLogs = () => {
    setAlerts([]);
  };

  // Action: Save Farm Demographics
  const saveFarmSettings = (newSettings: FarmSettings) => {
    setFarmSettings(newSettings);
  };

  // Action: AI chat messages triggers
  const handleSendChatMessage = async (text: string) => {
    if (isChatGenerating) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev: ChatMessage[]) => [...prev, userMsg]);
    setIsChatGenerating(true);

    try {
      const chatPayload = {
        message: text,
        history: chatHistory
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const apiResponseMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "model",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory((prev: ChatMessage[]) => [...prev, apiResponseMsg]);
        if (data.groundingSources) {
          setGroundingSources(data.groundingSources);
        }
      } else {
        throw new Error("Chat api failed");
      }
    } catch {
      // Chat Fallback messaging
      const answer: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: `Samahani, huduma ya AI haipatikani sasa hivi. Tafadhali jaribu tena baadaye.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev: ChatMessage[]) => [...prev, answer]);
    } finally {
      setIsChatGenerating(false);
    }
  };

  // Action: Crop Photo uploaded scanner triggers
  const handleAnalyzeCropImage = async (base64Image: string, mimeType: string, cropType: string) => {
    if (isAnalyzingImage) return;

    setIsAnalyzingImage(true);
    setActiveTab(Tab.UPLOAD_ANALYSIS); // Focus upload while scanning

    try {
      const payload = {
        imageBase64: base64Image,
        mimeType,
        cropTypePrompt: cropType === "Auto-Detect" ? "" : cropType
      };

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const assessment = await response.json();
        
        // Push a new record in our array state
        const num = analyses.length + 1;
        const record: AnalysisRecord = {
          id: `analyse-${num}`,
          title: `Data Analyse ${num}`,
          cropType: assessment.crop,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          healthScore: assessment.healthScore,
          riskLevel: assessment.riskLevel as "Low" | "Medium" | "High",
          diagnose: assessment.summary + " " + assessment.diagnosis + ". " + (assessment.severity !== 'None' ? `Spotted at standard ${assessment.severity} levels.` : ""),
          recommendations: assessment.recommendations,
          confidence: assessment.confidence,
          status: "Completed",
          imageUrl: base65ToDisplayPreview(base64Image, mimeType)
        };

        setAnalyses((prev: AnalysisRecord[]) => [record, ...prev]);
        setSelectedAnalysisId(record.id);
        setActiveTab(Tab.ANALYSIS_RESULTS); // Switch to results detail card!
      } else {
        throw new Error();
      }
    } catch {
      // Mock result fallback if everything breaks
      const num = analyses.length + 1;
      const fallbackRecord: AnalysisRecord = {
        id: `analyse-${num}`,
        title: `Data Analyse ${num}`,
        cropType: cropType !== "Auto-Detect" ? cropType : "Mahindi (Zea mays)",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        healthScore: 75,
        riskLevel: "Medium",
        diagnose: "Mahindi yako yanaonyesha dalili za upungufu wa nitrojeni. Majani yanaonekana ya njano kidogo kwenye ncha. Weka mbolea ya urea haraka.",
        recommendations: [
          "Apply trace nitrogen fertilizer side-dresses.",
          "Perform NPK leaf core extraction tests next Wednesday.",
          "Check soil clay absorption indices."
        ],
        confidence: 0.82,
        status: "Completed",
        imageUrl: base65ToDisplayPreview(base64Image, mimeType)
      };

      setAnalyses((prev: AnalysisRecord[]) => [fallbackRecord, ...prev]);
      setSelectedAnalysisId(fallbackRecord.id);
      setActiveTab(Tab.ANALYSIS_RESULTS);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const base65ToDisplayPreview = (b64: string, mime: string) => {
    if (b64.startsWith("data:")) return b64;
    return `data:${mime};base64,${b64}`;
  };

  const unreadAlertsCount = alerts.filter((a: Alert) => !a.read).length;

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-100 font-sans overflow-hidden select-none">
      
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadAlertsCount={unreadAlertsCount} 
        farmSettings={farmSettings}
      />

      {/* Main Panel Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header Row Panel */}
        <header className="h-19 shrink-0 bg-[#0d131f] border-b border-slate-800/50 px-6 flex items-center justify-between gap-6 select-none z-10 w-full">
          
          {/* Interactive Search Bar */}
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
            {/* Alerts Bell notification icon with badge */}
            <button
              id="top-notification-bell"
              onClick={() => setActiveTab(Tab.ALERTS_CENTER)}
              className="relative w-10 h-10 rounded-xl bg-[#151c28] border border-slate-800 hover:border-slate-750 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Weather status pill */}
            <div 
              onClick={() => setActiveTab(Tab.WEATHER_INTELLIGENCE)}
              className="bg-[#151c28] border border-slate-800/80 hover:border-slate-700/80 px-3.5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all select-none"
            >
              <Sun className="w-4 h-4 text-amber-400 rotate-animation" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-display">Sunny, 24°C</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>


          </div>
        </header>

        {/* Dynamic view layout container */}
        <main className="flex-1 min-h-0 bg-[#0b0e14] relative">
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
              <UploadAnalysisView
                onAnalyzeImage={handleAnalyzeCropImage}
                isAnalyzing={isAnalyzingImage}
              />
            )}
            {activeTab === Tab.ANALYSIS_RESULTS && (
              <AnalysisResultsView
                analyses={analyses}
                selectedId={selectedAnalysisId}
                onSelectId={setSelectedAnalysisId}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === Tab.WEATHER_INTELLIGENCE && (
              <WeatherIntelligenceView
                weather={weatherData}
              />
            )}
            {activeTab === Tab.MARKET_INTELLIGENCE && (
              <MarketIntelligenceView
                prices={marketPrices}
              />
            )}
            {activeTab === Tab.AI_RECOMMENDATIONS && (
              <RecommendationsView
                key={Tab.AI_RECOMMENDATIONS}
              />
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
                onSelectAnalysis={(rec) => setSelectedAnalysisId(rec.id)}
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
                onSelectFarmer={(farmer) => setSelectedFarmer(farmer)}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
