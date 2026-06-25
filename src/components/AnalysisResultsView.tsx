import React, { useState } from "react";
import { AnalysisRecord, Tab } from "../types";
import {
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
  Compass
} from "lucide-react";
import { motion } from "motion/react";

interface AnalysisResultsViewProps {
  analyses: AnalysisRecord[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  setActiveTab: (tab: Tab) => void;
}

export default function AnalysisResultsView({
  analyses,
  selectedId,
  onSelectId,
  setActiveTab
}: AnalysisResultsViewProps) {
  const activeRecord = analyses.find((a) => a.id === selectedId) || analyses[0];

  if (!activeRecord) {
    return (
      <div className="p-6 text-center my-auto">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-white text-lg font-bold">No pathology records logged yet</h3>
        <p className="text-slate-400 text-sm mt-1">Upload a crop photo in foliage analysis to start.</p>
        <button
          onClick={() => setActiveTab(Tab.UPLOAD_ANALYSIS)}
          className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold font-display tracking-wider uppercase cursor-pointer"
        >
          Begin First Upload
        </button>
      </div>
    );
  }

  // Health Score Color Settings
  const getScoreColors = (score: number) => {
    if (score >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", stroke: "#10b981" };
    if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", stroke: "#f59e0b" };
    return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", stroke: "#f43f5e" };
  };

  const schemeColors = getScoreColors(activeRecord.healthScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full overflow-y-auto pr-4 space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="text-emerald-400 w-7 h-7" /> Analysis Results & Prescriptions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detailed botanical diagnosis, pathology classifications, and treatment prescriptions.
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-[#1b2333] border border-slate-800 text-slate-300 hover:bg-[#222b3e] text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 max-w-max cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print/Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Pathology History List (4 cols) */}
        <div className="xl:col-span-4 bg-[#151c28] border border-slate-800/80 rounded-2xl p-4 space-y-3 max-h-[640px] overflow-y-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block px-2 mb-2">Analysis Index</span>
          
          <div className="space-y-2">
            {analyses.map((record) => {
              const rColors = getScoreColors(record.healthScore);
              const isActive = record.id === activeRecord.id;
              
              return (
                <div
                  key={record.id}
                  onClick={() => onSelectId(record.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#1f293d]/80 border-slate-705/80 border-emerald-500/30 ring-1 ring-emerald-500/15" 
                      : "bg-[#0d121c]/60 border-slate-800/50 hover:bg-[#1a2334]/55 hover:border-slate-700/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate pr-2 block max-w-[160px]">
                      {record.cropType}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide font-mono ${rColors.bg} ${rColors.text}`}>
                      {record.healthScore}% health
                    </span>
                  </div>
                  <h4 className="text-[11px] text-slate-400 mt-1 truncate">{record.diagnose}</h4>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {record.date}
                    </span>
                    <span>
                      {record.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: High Fidelity Prescription View (8 cols) */}
        <div className="xl:col-span-8 bg-[#151c28] border border-slate-800 rounded-2xl p-6 space-y-6">
          
          {/* Main info header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/50 pb-5">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Crop Pathology Report</span>
              <h2 className="text-xl font-display font-bold text-white mt-1">
                {activeRecord.cropType}
              </h2>
              <div className="flex gap-4 text-xs text-slate-405 mt-1.5 text-slate-400 font-mono">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date: {activeRecord.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Timed: {activeRecord.time}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 max-w-max">
              <span className="text-xs text-slate-400">Status</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {activeRecord.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Glowing circular SVG health display */}
            <div className="flex items-center gap-5 bg-slate-900/25 p-5 rounded-2xl border border-slate-800/40">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-800 fill-none"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="fill-none"
                    stroke={schemeColors.stroke}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * activeRecord.healthScore) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-display font-bold ${schemeColors.text}`}>
                    {activeRecord.healthScore}%
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Health</span>
                </div>
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-sm font-semibold text-slate-200">Foliage Vitality Rating</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Identified standard chlorophyll retention, moisture turgidity, and protein distribution levels.
                </p>
              </div>
            </div>

            {/* Pathological classification indicators */}
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/40 flex justify-between items-center">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Agronomist Confidence</span>
                <span className="text-xs font-mono font-bold text-white bg-[#1e2736]/40 px-2 py-1 rounded">{(activeRecord.confidence * 100).toFixed(0)}% accuracy</span>
              </div>
              
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/40 flex justify-between items-center">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"><AlertTriangle className="w-4 h-4 text-amber-500" /> Pathology Risk Factor</span>
                <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                  activeRecord.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  activeRecord.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {activeRecord.riskLevel} Risk
                </span>
              </div>
            </div>
          </div>

          {/* Diagnosis Block */}
          <div className="p-4 rounded-2xl bg-[#0d121c]/60 border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Compass className="w-4 h-4 text-emerald-400" /> Diagnostic Summary Node</h3>
            <p className="text-sm font-semibold text-white mt-2 select-text">{activeRecord.diagnose}</p>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed selection:bg-emerald-500/20 select-text">
              {activeRecord.diagnose}
            </p>
          </div>

          {/* Actionable Prescriptions Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Agronomist Actions & Prescriptions</h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {activeRecord.recommendations.map((rec, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-xl bg-slate-905/30 border border-slate-800/65 hover:border-slate-700/80 items-start select-text bg-[#0d121c]/45">
                  <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold shrink-0 mt-0.5 border border-emerald-500/20">
                    {index + 1}
                  </div>
                  <span className="text-xs text-slate-200 mt-0.5 leading-relaxed font-sans font-medium">
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
