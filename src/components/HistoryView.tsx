import React, { useState } from "react";
import { AnalysisRecord, Tab } from "../types";
import { History, Search, Filter, Calendar, FileText, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface HistoryViewProps {
  analyses: AnalysisRecord[];
  onSelectAnalysis: (record: AnalysisRecord) => void;
  setActiveTab: (tab: Tab) => void;
}

export default function HistoryView({
  analyses,
  onSelectAnalysis,
  setActiveTab
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch = item.cropType.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "All" || item.riskLevel === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full overflow-y-auto pr-4 space-y-6"
    >
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <History className="text-emerald-400 w-7 h-7" /> Timeline Log & Pathology History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical overview of crop diagnostics, vegetation index logging, and drone sensor history.
        </p>
      </div>

      {/* Control Box: Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#151c28] p-4 rounded-2xl border border-slate-800">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search crop varieties, pathogen names, diagnosis tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d121c] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        
        {/* Risk Filter buttons */}
        <div className="flex gap-2 shrink-0">
          {["All", "Low", "Medium", "High"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedFilter(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedFilter === lvl
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "bg-[#0d121c] text-slate-400 border border-slate-850 hover:text-slate-200"
              }`}
            >
              {lvl} {lvl !== "All" ? "Risk" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or List list of analyses items */}
      {filteredAnalyses.length === 0 ? (
        <div className="p-12 text-center bg-[#151c28] border border-slate-800 rounded-2xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white text-md font-bold">No results found matching queries</h3>
          <p className="text-slate-500 text-xs mt-1">Review search phrase or clear the active severity filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnalyses.map((record) => (
            <div
              key={record.id}
              onClick={() => {
                onSelectAnalysis(record);
                setActiveTab(Tab.ANALYSIS_RESULTS);
              }}
              className="p-5 bg-[#151c28] border border-slate-800/80 hover:border-slate-700 hover:bg-[#1a2335]/40 transition-all rounded-2xl cursor-pointer flex justify-between items-start group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/15 group-hover:scale-105 transition-transform duration-200">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{record.cropType}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Report ID: {record.id.slice(0, 8)} • {record.date}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-slate-400 font-medium font-sans">Diagnosis:</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans font-semibold">{record.diagnosis}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide font-mono ${
                  record.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  record.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {record.riskLevel} Risk
                </span>
                
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-1 rounded">
                  {record.healthScore}% health
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
