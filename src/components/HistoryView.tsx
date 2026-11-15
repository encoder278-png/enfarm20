
import React, { useMemo, useState } from "react";
import { AnalysisRecord, Tab } from "../types";
import {
  History,
  Search,
  FileText,
  Calendar,
  ArrowUpRight,
  Leaf,
  Filter,
  Clock3,
  ClipboardList,
  X,
} from "lucide-react";
import { motion } from "motion/react";

interface HistoryViewProps {
  analyses: AnalysisRecord[];
  onSelectAnalysis: (record: AnalysisRecord) => void;
  setActiveTab: (tab: Tab) => void;
}

export default function HistoryView({
  analyses,
  onSelectAnalysis,
  setActiveTab,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filteredAnalyses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return analyses.filter((item) => {
      const matchesSearch =
        !query ||
        (item.cropType || "").toLowerCase().includes(query) ||
        (item.diagnose || "").toLowerCase().includes(query) ||
        (item.id || "").toLowerCase().includes(query);

      const matchesFilter =
        selectedFilter === "All" ||
        item.riskLevel === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [analyses, searchQuery, selectedFilter]);

  const riskStyle = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const openAnalysis = (record: AnalysisRecord) => {
    onSelectAnalysis(record);
    setActiveTab(Tab.ANALYSIS_RESULTS);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto bg-[#F4F5F0] p-5 text-[#183D32] md:p-8"
    >
      <div className="mx-auto max-w-[1500px] space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#789084]">
              <Leaf size={15} />
              Records and observations
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Analysis history
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#718078]">
              Review previous crop assessments and revisit recorded
              observations from EnFarm.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-[#DCE5DC] bg-white px-4 py-3">
            <ClipboardList size={18} className="text-[#527660]" />
            <div>
              <p className="text-lg font-bold leading-none">
                {analyses.length}
              </p>
              <p className="mt-1 text-[10px] font-medium text-[#89968D]">
                Recorded analyses
              </p>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <section className="rounded-2xl border border-[#DCE5DC] bg-white p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-3.5 text-[#89968D]"
              />

              <input
                type="text"
                placeholder="Search by crop, diagnosis or report ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#DCE5DC] bg-[#F8F9F6] py-3 pl-11 pr-10 text-sm text-[#183D32] outline-none transition focus:border-[#789B83] focus:ring-2 focus:ring-[#789B83]/10"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-3 rounded-md p-1 text-[#89968D] hover:bg-[#EDF3ED]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 flex items-center gap-2 text-xs font-semibold text-[#718078]">
                <Filter size={15} />
                Risk level
              </div>

              {["All", "Low", "Medium", "High"].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedFilter(level)}
                  className={`rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition ${
                    selectedFilter === level
                      ? "border-[#183D32] bg-[#183D32] text-white"
                      : "border-[#DCE5DC] bg-white text-[#718078] hover:border-[#A9B9AA] hover:text-[#183D32]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF0EA] pt-3">
            <p className="text-xs text-[#89968D]">
              Showing{" "}
              <span className="font-bold text-[#52665A]">
                {filteredAnalyses.length}
              </span>{" "}
              of {analyses.length} recorded analyses
            </p>

            {(searchQuery || selectedFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("All");
                }}
                className="text-xs font-semibold text-[#527660] hover:text-[#183D32]"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* Analysis records */}
        {filteredAnalyses.length === 0 ? (
          <section className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-[#DCE5DC] bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF3ED] text-[#527660]">
              {analyses.length === 0 ? (
                <History size={26} />
              ) : (
                <Search size={26} />
              )}
            </div>

            <h2 className="mt-5 text-base font-bold text-[#183D32]">
              {analyses.length === 0
                ? "No analysis records yet"
                : "No matching records"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#89968D]">
              {analyses.length === 0
                ? "Crop assessments received and saved by EnFarm will appear here."
                : "Try a different search term or clear the selected risk filter."}
            </p>

            {analyses.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("All");
                }}
                className="mt-5 rounded-xl border border-[#DCE5DC] px-4 py-2.5 text-xs font-semibold text-[#527660] hover:bg-[#F5F7F3]"
              >
                Reset filters
              </button>
            )}
          </section>
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#52665A]">
                Recorded assessments
              </h2>
              <span className="text-xs text-[#89968D]">
                Select a record to view details
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredAnalyses.map((record, index) => (
                <motion.button
                  key={record.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.04, 0.2),
                  }}
                  onClick={() => openAnalysis(record)}
                  className="group w-full rounded-2xl border border-[#DCE5DC] bg-white p-5 text-left transition hover:border-[#A9B9AA] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#789B83]/30 md:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF3ED] text-[#527660] transition group-hover:bg-[#E3ECE2]">
                        <FileText size={20} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#183D32]">
                          {record.cropType || "Crop assessment"}
                        </h3>
                        <p className="mt-1 truncate font-mono text-[10px] text-[#89968D]">
                          Report ID: {record.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${riskStyle(
                        record.riskLevel
                      )}`}
                    >
                      {record.riskLevel || "Unspecified"} risk
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#89968D]">
                      Diagnosis / observation
                    </p>

                    <p className="line-clamp-3 text-sm leading-6 text-[#52665A]">
                      {record.diagnose || "No diagnosis details recorded."}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF0EA] pt-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#89968D]">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {record.date || "Date unavailable"}
                      </span>

                      {record.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {record.time}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-xs font-bold text-[#527660] transition group-hover:text-[#183D32]">
                      View report
                      <ArrowUpRight size={15} />
                    </span>
                  </div>

                  {typeof record.healthScore === "number" &&
                    Number.isFinite(record.healthScore) && (
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F5F7F3] px-3 py-2">
                        <span className="text-xs font-medium text-[#718078]">
                          Recorded health score
                        </span>
                        <span className="text-sm font-bold text-[#315F48]">
                          {record.healthScore}%
                        </span>
                      </div>
                    )}
                </motion.button>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-center gap-2 pb-2 text-xs text-[#A0AAA2]">
          <Leaf size={13} />
          EnFarm analysis records
        </div>
      </div>
    </motion.div>
  );
}
