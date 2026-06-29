export enum Tab {
  DASHBOARD = 'DASHBOARD',
  AI_ASSISTANT = 'AI_ASSISTANT',
  UPLOAD_ANALYSIS = 'UPLOAD_ANALYSIS',
  ANALYSIS_RESULTS = 'ANALYSIS_RESULTS',
  WEATHER_INTELLIGENCE = 'WEATHER_INTELLIGENCE',
  MARKET_INTELLIGENCE = 'MARKET_INTELLIGENCE',
  AI_RECOMMENDATIONS = 'AI_RECOMMENDATIONS',
  ALERTS_CENTER = 'ALERTS_CENTER',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
FARMERS = 'FARMERS',
WHATSAPP_CHAT = 'WHATSAPP_CHAT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AnalysisRecord {
  id: string;
  title: string;
  date: string;
  time: string;
  cropType: string;
  healthScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  diagnose: string;
  recommendations: string[];
  imageUrl?: string;
  confidence: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface Alert {
  id: string;
  title: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Severe';
  timestamp: string;
  read: boolean;
  message: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
  weeklyForecast: { day: string; temp: number; humidity: number; condition: string }[];
}

export interface MarketCropPrice {
  id: string;
  name: string;
  price: number;
  currency: string;
  unit: string;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
  marketCap: string;
  volume24h: string;
}

export interface FarmSettings {
  farmName: string;
  ownerName: string;
  location: string;
  farmSizeAcres: number;
  primaryCrops: string[];
  soilType: string;
  irrigationMethod: string;
  autoAlertsEnabled: boolean;
  apiGroundingEnabled: boolean;
}
export interface FarmerProfile {
  farmerId: string;
  name?: string;
  region?: string;
  crops: string[];
  diseases: {
    cropType: string | null;
    diagnosis: string | null;
    severity: string | null;
    healthScore: number | null;
    confidence: number | null;
    timestamp: string;
  }[];
  conversations: {
    role: "farmer" | "cen";
    text: string;
    timestamp: string;
  }[];
  lastActive: string;
}