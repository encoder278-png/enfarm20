import React from "react";
import { Tab, AnalysisRecord, Alert } from "../types";
import {
  TrendingUp,
  CloudSun,
  Lightbulb,
  Bell,
  ArrowRight,
  MoreHorizontal,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardViewProps {
  setActiveTab: (tab: Tab) => void;
  analyses: AnalysisRecord[];
  alerts: Alert[];
  onSelectAnalysis: (record: AnalysisRecord) => void;
}

export default function DashboardView({
  setActiveTab,
  analyses,
  alerts,
  onSelectAnalysis
}: DashboardViewProps) {
  // Take last 4 analyses
  const recentAnalyses = analyses.slice(0, 4);

  // Take active alerts
  const activeAlerts = alerts.filter(a => !a.read).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="p-6 space-y-6 overflow-y-auto h-full pr-4"
    >
      {/* Title & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kituo cha udhibiti cha EnFarm — Tanzania
          </p>
        </div>
        <div className="bg-[#12c481]/15 border border-[#12c481]/35 px-4 y-2 py-1.5 rounded-full flex items-center gap-2 max-w-max">
          <span className="w-2.5 h-2.5 rounded-full bg-[#12c481] animate-pulse" />
          <span className="text-xs font-display font-bold text-[#12c481] tracking-wide uppercase">
            Farm Status: Optimal
          </span>
        </div>
      </div>

      {/* Grid Layout of Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Group (8 / 12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Metric Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Farm Health Score */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => setActiveTab(Tab.UPLOAD_ANALYSIS)}
              className="bg-gradient-to-br from-emerald-950/25 to-[#151c28]/95 border border-emerald-500/20 hover:border-emerald-500/40 p-6 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[180px]"
            >
              <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Farm Health Score
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-400/70" />
              </div>
              <div className="my-3">
                <span className="text-5xl font-display font-bold text-[#12c481] leading-none tracking-tight">
                  92%
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                Emerald designed Green health index dashboard. Overall structure is optimal.
              </p>
            </motion.div>

            {/* Card 2: Crop Population */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => setActiveTab(Tab.ANALYSIS_RESULTS)}
              className="bg-[#151c28]/95 border border-slate-800/80 hover:border-slate-700 p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-[180px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider text-slate-400">
                  Crop Population
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="my-3">
                <span className="text-4xl font-display font-bold text-white tracking-tight">
                  1.2M
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#192233] px-3.5 py-2.5 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-400">Quickes count</span>
                <span className="text-sm font-semibold text-emerald-400 font-mono">24</span>
              </div>
            </motion.div>

            {/* Card 3: Disease Risk Level */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => setActiveTab(Tab.ALERTS_CENTER)}
              className="bg-[#151c28]/95 border border-cyan-500/20 hover:border-cyan-500/40 p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-[180px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Disease Risk Level
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400/80" />
              </div>
              <div className="my-3">
                <span className="text-4xl font-display font-bold text-[#06b6d4] tracking-tight">
                  Low
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Active leaf rust threat neutralized. No microclimate pathogens flagged today.
              </p>
            </motion.div>
          </div>

          {/* Recent Analyses Card (Replicating Bottom Left) */}
          <div className="bg-[#151c28]/95 border border-slate-800/70 rounded-2xl overflow-hidden p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-white">
                Recent Analyses
              </h2>
              <button
                onClick={() => setActiveTab(Tab.ANALYSIS_RESULTS)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3.5">
              {recentAnalyses.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onSelectAnalysis(record)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0f1420]/80 border border-slate-800/60 hover:bg-[#1b2333]/90 hover:border-slate-700/80 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {record.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {record.cropType} • diagnose: {record.diagnose}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                      record.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      record.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {record.riskLevel} Risk
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {record.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Prices Chart Section */}
          <div className="bg-[#151c28]/95 border border-slate-800/70 p-6 rounded-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-white">
                  Market Prices
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Agricultural commodity index fluctuations</p>
              </div>
              <div className="flex items-center gap-2 bg-[#1b2333] border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300 cursor-pointer hover:bg-slate-800">
                <span className="font-medium text-emerald-400">Trends</span>
                <span className="text-slate-500 text-[10px]">▼</span>
              </div>
            </div>

            {/* Glowing High Fidelity Chart SVG */}
            <div className="relative h-44 w-full bg-[#0d121c]/60 rounded-xl overflow-hidden p-4 border border-slate-800/30 flex flex-col justify-end">
              {/* Overlay lines of targets */}
              <div className="absolute right-4 top-4 text-[10px] text-slate-500 font-mono flex gap-4">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>Soybeans</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"/>Flour/Wheat</span>
              </div>

              {/* Grid Y Axis Guides */}
              <div className="absolute left-4 right-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-800/40 w-full flex justify-between pt-0.5">
                  <span className="text-[9px] text-slate-600 font-mono relative top-[-6px]">$80</span>
                </div>
                <div className="border-t border-slate-800/40 w-full flex justify-between pt-0.5">
                  <span className="text-[9px] text-slate-600 font-mono relative top-[-6px]">$50</span>
                </div>
                <div className="border-t border-slate-800/30 w-full flex justify-between pt-0.5">
                  <span className="text-[9px] text-slate-600 font-mono relative top-[-6px]">$30</span>
                </div>
              </div>

              {/* Dynamic Chart paths */}
              <svg className="w-full h-full absolute inset-x-0 bottom-6 px-10" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-green-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="chart-cyan-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Cyber Splines filled areas */}
                <path
                  d="M 0,110 C 60,85 110,65 180,80 C 250,95 310,40 380,55 C 430,65 470,30 500,40 L 500,120 L 0,120 Z"
                  fill="url(#chart-green-grad)"
                />
                
                <path
                  d="M 0,90 C 70,55 120,80 190,40 C 260,10 320,70 390,45 C 440,25 470,15 500,20 L 500,120 L 0,120 Z"
                  fill="url(#chart-cyan-grad)"
                  opacity="0.7"
                />

                {/* Cyber lines stroking */}
                <path
                  d="M 0,110 C 60,85 110,65 180,80 C 250,95 310,40 380,55 C 430,65 470,30 500,40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                <path
                  d="M 0,90 C 70,55 120,80 190,40 C 260,10 320,70 390,45 C 440,25 470,15 500,20"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="1 1"
                />

                {/* Hotspot tracking circles */}
                <circle cx="380" cy="55" r="4.5" fill="#10b981" stroke="#151c28" strokeWidth="1.5" />
                <circle cx="190" cy="40" r="4.5" fill="#06b6d4" stroke="#151c28" strokeWidth="1.5" />
              </svg>

              {/* X Axis Time Legends */}
              <div className="flex justify-between text-[10px] text-slate-550 font-mono mt-2 pt-1 border-t border-slate-800/20 px-4 text-slate-500">
                <span>04 AM</span>
                <span>08 AM</span>
                <span>12 PM</span>
                <span>04 PM</span>
                <span>08 PM</span>
                <span>12 AM</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Group (4 / 12) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Weather Overview Card */}
          <div className="bg-[#151c28]/95 border border-slate-800/70 p-6 rounded-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-300 font-display flex items-center gap-1.5">
                <CloudSun className="w-4.5 h-4.5 text-amber-400" /> Weather Overview
              </span>
              <button className="text-slate-450 hover:text-white cursor-pointer select-none">
                <MoreHorizontal className="w-5 h-5 text-slate-500 hover:text-slate-300" />
              </button>
            </div>

            {/* Weather mini stat details */}
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-display font-bold text-white leading-none">24°C</span>
              <span className="text-xs text-slate-400">Sunny • humidity 48%</span>
            </div>

            {/* Glowing spline weather chart */}
            <div className="relative h-28 w-full mt-4 bg-[#0d121c]/40 rounded-xl overflow-hidden p-2">
              <svg className="w-full h-full absolute inset-0 px-2" viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weather-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,60 C 40,40 80,50 120,25 C 160,5 200,45 240,30 C 270,15 290,20 300,25 L 300,80 L 0,80 Z"
                  fill="url(#weather-blue)"
                />
                <path
                  d="M 0,60 C 40,40 80,50 120,25 C 160,5 200,45 240,30 C 270,15 290,20 300,25"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />
                
                {/* selected Wednesday node matching visual */}
                <circle cx="120" cy="25" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                
                {/* Value float text info */}
                <rect x="98" y="0" width="44" height="15" rx="3" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
                <text x="120" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">24°C</text>
              </svg>

              {/* Week markers */}
              <div className="flex justify-between text-[8px] text-slate-550 font-mono absolute bottom-1 inset-x-0 px-4 text-slate-500 select-none">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span className="text-[#3b82f6] font-bold">Wed</span>
                <span>Thu</span>
                <span>Fri</span>
              </div>
            </div>
          </div>

          {/* Quick Price Display Badge */}
          <div 
            onClick={() => setActiveTab(Tab.MARKET_INTELLIGENCE)}
            className="bg-gradient-to-r from-cyan-950/20 to-[#151c28]/95 border border-cyan-500/15 hover:border-cyan-500/30 p-4.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform duration-250">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Quickt Price
                </h4>
                <p className="text-xs text-slate-400">Bei ya mahindi imepanda 2.1% wiki hii</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </div>

          {/* AI Recommendations Highlight Card */}
          <div 
            onClick={() => setActiveTab(Tab.AI_RECOMMENDATIONS)}
            className="bg-[#151c28]/95 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 cursor-pointer transition-all duration-350"
          >
            <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-300 font-display flex items-center gap-1.5">
                <Lightbulb className="w-4.5 h-4.5 text-emerald-400" /> AI Recommendations
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3 text-justify">
              "Recommendations a world class agricultural analyses of freshpress functional clarity and untered AI advice."
            </p>
            <div className="bg-[#0e131d] p-3 rounded-xl border border-slate-800/40 mb-4">
              <p className="text-[11px] text-[#12c481] leading-normal font-medium">
                AI Recommendations, summary daily recommendations summary index.
              </p>
            </div>
            <button className="w-full text-center text-xs py-2.5 rounded-xl font-medium bg-[#1e2736] hover:bg-emerald-500 hover:text-white text-slate-300 transition-all duration-300">
              Learn more
            </button>
          </div>

          {/* Active Alerts Card */}
          <div className="bg-[#151c28]/95 border border-slate-800/70 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-slate-300 font-display flex items-center gap-1.5">
                <Bell className="w-4.5 h-4.5 text-rose-400" /> Active Alerts
              </span>
              <button 
                onClick={() => setActiveTab(Tab.ALERTS_CENTER)}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="flex gap-3 items-start p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl hover:bg-slate-900/60 transition-colors">
                  <div className={`mt-0.5 w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${
                    alert.riskLevel === 'Severe' ? 'bg-rose-500/10 text-rose-400' :
                    alert.riskLevel === 'High' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-sky-500/10 text-sky-400'
                  }`}>
                    {alert.riskLevel === 'Severe' ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate">
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {alert.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
