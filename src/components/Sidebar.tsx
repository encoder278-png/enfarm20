
import React from "react";
import { Tab, FarmSettings } from "../types";
import {
  LayoutDashboard,
  Camera,
  History as HistoryIcon,
  MessageCircle,
  Bell,
  FileText,
  Settings,
  Leaf,
  User,
} from "lucide-react";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  unreadAlertsCount: number;
  farmSettings?: FarmSettings;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  unreadAlertsCount,
  farmSettings,
}: SidebarProps) {
  const navItems = [
    { tab: Tab.DASHBOARD, label: "Home", icon: LayoutDashboard },
    { tab: Tab.UPLOAD_ANALYSIS, label: "Camera / Live", icon: Camera },
    { tab: Tab.HISTORY, label: "History", icon: HistoryIcon },
    { tab: Tab.WHATSAPP_CHAT, label: "WhatsApp", icon: MessageCircle },
    { tab: Tab.ALERTS_CENTER, label: "Alerts", icon: Bell },
    { tab: Tab.ANALYSIS_RESULTS, label: "Reports", icon: FileText },
    { tab: Tab.SETTINGS, label: "Settings", icon: Settings },
  ];

  const ownerName = farmSettings?.ownerName?.trim();
  const location = farmSettings?.location?.trim();
  const initial = ownerName?.charAt(0).toUpperCase() || "E";

  return (
    <aside className="enfarm-sidebar flex h-full w-64 shrink-0 flex-col border-r">
      <div className="px-5 pb-5 pt-6">
        <button
          type="button"
          onClick={() => setActiveTab(Tab.DASHBOARD)}
          className="flex items-center gap-3 text-left"
          aria-label="Go to EnFarm Home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDEFE4] text-[#183D32]">
            <Leaf size={23} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-xl font-bold tracking-tight text-[#183D32]">
              EnFarm
            </span>
            <span className="block text-xs text-[#64766D]">
              Farm intelligence
            </span>
          </span>
        </button>
      </div>

      <div className="px-5 pb-2 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#819087]">
          Workspace
        </p>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {navItems.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              id={`nav-btn-${tab.toLowerCase()}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={isActive ? "page" : undefined}
              className={`enfarm-nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                isActive ? "is-active" : ""
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{label}</span>

              {tab === Tab.ALERTS_CENTER && unreadAlertsCount > 0 && (
                <span className="min-w-6 rounded-full bg-[#B54736] px-2 py-0.5 text-center text-xs font-semibold text-white">
                  {unreadAlertsCount > 99 ? "99+" : unreadAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#E1E6DF] p-4">
        <button
          type="button"
          onClick={() => setActiveTab(Tab.SETTINGS)}
          className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#EDF2EC]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDEFE4] font-semibold text-[#183D32]">
            {initial}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[#243B31]">
              {ownerName || "Account"}
            </span>
            <span className="block truncate text-xs text-[#718076]">
              {location || "Farm location not set"}
            </span>
          </span>

          <User size={17} className="shrink-0 text-[#718076]" />
        </button>
      </div>
    </aside>
  );
}
