import React from "react";
import { Tab, FarmSettings } from "../types";
import {
  LayoutDashboard,
  Bot,
  UploadCloud,
  TrendingUp,
  CloudSun,
  Lightbulb,
  Bell,
  History,
  Settings,
  Leaf,
  User,
  MessageCircle
} from "lucide-react";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  unreadAlertsCount: number;
  farmSettings?: FarmSettings;
}

export default function Sidebar({ activeTab, setActiveTab, unreadAlertsCount, farmSettings }: SidebarProps) {
  const navItems: Array<{ tab: Tab; label: string; icon: any; badge?: number; live?: boolean }> = [
    { tab: Tab.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
    { tab: Tab.AI_ASSISTANT, label: "AI Assistant", icon: Bot },
    { tab: Tab.UPLOAD_ANALYSIS, label: "Upload Analysis", icon: UploadCloud },
    { tab: Tab.ANALYSIS_RESULTS, label: "Analysis Results", icon: TrendingUp }, // In screenshot it uses a BarChart icon
    { tab: Tab.WEATHER_INTELLIGENCE, label: "Weather Intelligence", icon: CloudSun },
    { tab: Tab.MARKET_INTELLIGENCE, label: "Market Intelligence", icon: TrendingUp }, // Or custom chart line icon
    { tab: Tab.AI_RECOMMENDATIONS, label: "AI Recommendations", icon: Lightbulb },
    { tab: Tab.ALERTS_CENTER, label: "Alerts Center", icon: Bell, badge: unreadAlertsCount },
    { tab: Tab.HISTORY, label: "History", icon: History },
    { tab: Tab.FARMERS, label: "Farmers", icon: User },
    { tab: Tab.WHATSAPP_CHAT, label: "WhatsApp Chat", icon: MessageCircle },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-slate-800/60 flex flex-col justify-between h-full shrink-0 select-none">
      {/* Brand Logo and Name */}
      <div className="p-6 pb-4">
        <div 
          onClick={() => setActiveTab(Tab.DASHBOARD)}
          className="flex items-center gap-3 cursor-pointer group"
          id="sidebar-logo-container"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-300">
            <Leaf className="w-5.5 h-5.5 fill-emerald-500/20" />
          </div>
          <span className="text-xl font-display font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors">
            EnFarm
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              id={`nav-btn-${item.tab.toLowerCase()}`}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-[#1d2736]/90 text-white shadow-sm border border-slate-700/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-[#131b28]/60"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r-md" />
              )}
              <Icon className={`w-4.5 h-4.5 shrink-0 transition-all ${
                isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-400/80"
              } ${item.live ? "text-cyan-400 group-hover:scale-110" : ""}`} />
              <span className="truncate">{item.label}</span>
              {item.live && (
                <span className="ml-auto bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold animate-pulse tracking-wide">
                  OS 2030
                </span>
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Settings Navigation & Profile Card */}
      <div className="p-4 border-t border-slate-800/40 space-y-3">
        <button
          id="nav-btn-settings"
          onClick={() => setActiveTab(Tab.SETTINGS)}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
            activeTab === Tab.SETTINGS
              ? "bg-[#1d2736] text-white border border-slate-700/30"
              : "text-slate-400 hover:text-slate-100 hover:bg-[#131b28]/50"
          }`}
        >
          {activeTab === Tab.SETTINGS && (
            <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r-md" />
          )}
          <Settings className={`w-4.5 h-4.5 shrink-0 transition-colors ${
            activeTab === Tab.SETTINGS ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"
          }`} />
          <span>Settings</span>
        </button>

        {/* Space-age John Farmer User Profile Panel matching mockup screenshot exactly */}
        <div 
          onClick={() => setActiveTab(Tab.SETTINGS)}
          className="p-3 bg-[#0a0f18]/90 border border-slate-800/60 rounded-xl flex items-center gap-3 cursor-pointer hover:border-emerald-500/30 hover:bg-[#111827]/40 transition-all group select-none"
        >
          {/* Avatar sphere with neon ring and silhouette */}
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative group-hover:border-emerald-400 transition-colors shrink-0">
            <User className="w-5 h-5" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d131f]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
              {farmSettings?.ownerName || "John Farmer"}
            </p>
            <p className="text-xs text-slate-500 truncate font-medium">
              Maize • {farmSettings?.location ? (farmSettings.location.includes("Kilimanjaro") ? "Kilimanjaro" : "Kilimanjaro") : "Kilimanjaro"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
