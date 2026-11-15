
import React from "react";
import { AnalysisRecord, Tab } from "../types";
import {
  FileText,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
  Compass,
  Leaf,
  ArrowLeft,
  UserRound,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
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
  setActiveTab,
}: AnalysisResultsViewProps) {
  const activeRecord =
    analyses.find((record) => record.id === selectedId) || analyses[0];

  const getScoreColors = (score: number | null | undefined) => {
    if (typeof score !== "number" || !Number.isFinite(score)) {
      return {
        text: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
        stroke: "#94A3B8",
      };
    }

    if (score >= 80) {
      return {
        text: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        stroke: "#16845B",
      };
    }

    if (score >= 50) {
      return {
        text: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        stroke: "#D69A25",
      };
    }

    return {
      text: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      stroke: "#D65B5B",
    };
  };

  const getRiskStyle = (risk: string | undefined) => {
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

  const getSourceDetails = (source?: string) => {
    switch (source) {
      case "whatsapp_image":
        return {
          label: "WhatsApp image assessment",
          icon: ImageIcon,
        };

      case "whatsapp_conversation":
        return {
          label: "WhatsApp conversation assessment",
          icon: MessageSquare,
        };

      case "web_conversation":
        return {
          label: "Web conversation assessment",
          icon: MessageSquare,
        };

      default:
        return {
          label: "Source not recorded",
          icon: FileText,
        };
    }
  };

  const formatConfidence = (confidence: number | null | undefined) => {
    if (
      typeof confidence !== "number" ||
      !Number.isFinite(confidence)
    ) {
      return "Not recorded";
    }

    const percentage =
      confidence <= 1 ? confidence * 100 : confidence;

    return `${Math.round(Math.max(0, Math.min(100, percentage)))}%`;
  };

  const formatHealthScore = (score: number | null | undefined) => {
    if (
      typeof score !== "number" ||
      !Number.isFinite(score)
    ) {
      return "Not recorded";
    }

    return `${Math.round(Math.max(0, Math.min(100, score)))}%`;
  };

  if (!activeRecord) {
    return (
      <div className="min-h-full bg-[#F4F6F1] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white border border-[#E5EAE3] rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF4EE] flex items-center justify-center mx-auto mb-5">
            <FileText className="w-8 h-8 text-[#315F48]" />
          </div>

          <h2 className="text-xl font-bold text-[#203D30]">
            No assessments recorded
          </h2>

          <p className="text-sm text-[#78877C] leading-relaxed mt-2">
            Crop assessments will appear here when they are successfully
            saved from farmer WhatsApp conversations or image analysis.
          </p>

          <button
            onClick={() => setActiveTab(Tab.DASHBOARD)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#315F48] hover:bg-[#254C39] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const healthScore = activeRecord.healthScore;
  const hasHealthScore =
    typeof healthScore === "number" && Number.isFinite(healthScore);

  const safeScore = hasHealthScore
    ? Math.max(0, Math.min(100, healthScore))
    : 0;

  const schemeColors = getScoreColors(healthScore);
  const sourceDetails = getSourceDetails(activeRecord.source);
  const SourceIcon = sourceDetails.icon;

  const recommendations = Array.isArray(activeRecord.recommendations)
    ? activeRecord.recommendations.filter(
        (item) => typeof item === "string" && item.trim().length > 0
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="min-h-full bg-[#F4F6F1] p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#66816D] uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4" />
            Agricultural monitoring
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#203D30]">
            Assessment Details
          </h1>

          <p className="text-sm text-[#78877C] mt-1">
            Review recorded crop assessments and their recommendations.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCE5DA] bg-white hover:bg-[#F8FAF6] text-[#315F48] text-sm font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print report
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* Assessment list */}
        <aside className="xl:col-span-4 bg-white border border-[#E3E9E0] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between px-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#294636]">
                Assessment history
              </h2>

              <p className="text-xs text-[#8A978C] mt-0.5">
                {analyses.length} recorded assessment
                {analyses.length === 1 ? "" : "s"}
              </p>
            </div>

            <span className="text-xs font-semibold text-[#66816D] bg-[#EEF4EE] px-2.5 py-1 rounded-full">
              History
            </span>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {analyses.map((record) => {
              const colors = getScoreColors(record.healthScore);
              const isActive = record.id === activeRecord.id;

              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => onSelectId(record.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive
                      ? "bg-[#F0F5EF] border-[#A8C3AC] shadow-sm"
                      : "bg-white border-[#E9EDE7] hover:bg-[#F8FAF6] hover:border-[#CAD8C9]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#294636] truncate">
                        {record.cropType || "Crop not recorded"}
                      </h3>

                      <p className="text-xs text-[#78877C] mt-1 line-clamp-2">
                        {record.diagnose || "No diagnosis recorded"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${colors.bg} ${colors.text}`}
                    >
                      {formatHealthScore(record.healthScore)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 text-[11px] text-[#89958B]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {record.date || "Unknown date"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {record.time || "Unknown time"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Selected assessment */}
        <main className="xl:col-span-8 space-y-5">

          {/* Assessment heading */}
          <section className="bg-white border border-[#E3E9E0] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#66816D] uppercase tracking-wider">
                  <Leaf className="w-4 h-4" />
                  Crop assessment
                </div>

                <h2 className="text-2xl font-bold text-[#203D30] mt-2">
                  {activeRecord.cropType || "Crop not recorded"}
                </h2>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-[#879389]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeRecord.date || "Unknown date"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {activeRecord.time || "Unknown time"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start">
                <CheckCircle2 className="w-4 h-4 text-[#66816D]" />

                <span className="text-xs font-semibold text-[#315F48] bg-[#EEF4EE] border border-[#DCE9DA] px-3 py-1.5 rounded-full">
                  {activeRecord.status || "Unknown status"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#EDF0EA] mt-5 pt-4 flex flex-wrap gap-x-5 gap-y-3">
              <div className="flex items-center gap-2 text-xs text-[#78877C]">
                <SourceIcon className="w-4 h-4 text-[#66816D]" />
                {sourceDetails.label}
              </div>

              {activeRecord.farmerId && (
                <div className="flex items-center gap-2 text-xs text-[#78877C]">
                  <UserRound className="w-4 h-4 text-[#66816D]" />
                  <span>Farmer ID:</span>
                  <span className="font-mono text-[#496653]">
                    {activeRecord.farmerId}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Health and indicators */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Health score */}
            <div className="bg-white border border-[#E3E9E0] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#294636]">
                Crop health score
              </h3>

              <p className="text-xs text-[#879389] mt-1">
                AI-estimated assessment
              </p>

              <div className="flex items-center gap-5 mt-5">
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                    aria-label={
                      hasHealthScore
                        ? `Crop health score ${formatHealthScore(healthScore)}`
                        : "Crop health score not recorded"
                    }
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E8EDE6"
                      strokeWidth="8"
                      fill="none"
                    />

                    {hasHealthScore && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={schemeColors.stroke}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={251.2}
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{
                          strokeDashoffset:
                            251.2 - (251.2 * safeScore) / 100,
                        }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                    )}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-xl font-bold ${schemeColors.text}`}
                    >
                      {formatHealthScore(healthScore)}
                    </span>

                    <span className="text-[9px] uppercase tracking-widest text-[#98A398] font-semibold mt-1">
                      Health
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#294636]">
                    Recorded health
                  </p>

                  <p className="text-xs text-[#879389] leading-relaxed mt-1">
                    {hasHealthScore
                      ? "This is the health score recorded for this assessment."
                      : "No numerical health score was saved for this assessment."}
                  </p>
                </div>
              </div>
            </div>

            {/* AI indicators */}
            <div className="bg-white border border-[#E3E9E0] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#294636]">
                Assessment indicators
              </h3>

              <p className="text-xs text-[#879389] mt-1">
                Information available in this record
              </p>

              <div className="space-y-3 mt-5">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F9F5] border border-[#EDF0EA]">
                  <span className="flex items-center gap-2 text-xs font-medium text-[#78877C]">
                    <ShieldCheck className="w-4 h-4 text-[#66816D]" />
                    AI confidence
                  </span>

                  <span className="text-sm font-bold text-[#315F48]">
                    {formatConfidence(activeRecord.confidence)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F9F5] border border-[#EDF0EA]">
                  <span className="flex items-center gap-2 text-xs font-medium text-[#78877C]">
                    <AlertTriangle className="w-4 h-4 text-[#A68B53]" />
                    Risk level
                  </span>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${getRiskStyle(
                      activeRecord.riskLevel
                    )}`}
                  >
                    {activeRecord.riskLevel || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Diagnosis */}
          <section className="bg-white border border-[#E3E9E0] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#EEF4EE] flex items-center justify-center">
                <Compass className="w-5 h-5 text-[#315F48]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#294636]">
                  Diagnosis
                </h3>

                <p className="text-xs text-[#879389]">
                  Recorded AI assessment
                </p>
              </div>
            </div>

            <p className="text-sm text-[#43594A] leading-relaxed mt-4">
              {activeRecord.diagnose || "No diagnosis was recorded."}
            </p>

            <p className="text-[11px] text-[#9AA49B] mt-4">
              AI assessments are guidance and should be verified against
              field observations where necessary.
            </p>
          </section>

          {/* Recommendations */}
          <section className="bg-white border border-[#E3E9E0] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#294636]">
                  Recommended actions
                </h3>

                <p className="text-xs text-[#879389] mt-1">
                  Recommendations saved with this assessment
                </p>
              </div>

              {recommendations.length > 0 && (
                <span className="text-xs font-semibold text-[#315F48] bg-[#EEF4EE] px-3 py-1.5 rounded-full">
                  {recommendations.length} recorded
                </span>
              )}
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-3 mt-5">
                {recommendations.map((recommendation, index) => (
                  <div
                    key={`${activeRecord.id}-recommendation-${index}`}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F7F9F5] border border-[#EDF0EA]"
                  >
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-[#E8F0E7] flex items-center justify-center text-xs font-bold text-[#315F48]">
                      {index + 1}
                    </span>

                    <p className="text-sm text-[#526458] leading-relaxed pt-1">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 p-5 rounded-xl bg-[#F7F9F5] border border-dashed border-[#DCE5DA] text-center">
                <FileText className="w-6 h-6 text-[#A0ADA1] mx-auto mb-2" />

                <p className="text-sm font-medium text-[#607265]">
                  No recommendations recorded
                </p>

                <p className="text-xs text-[#96A197] mt-1">
                  This assessment does not contain saved recommendations.
                </p>
              </div>
            )}
          </section>

        </main>
      </div>
    </motion.div>
  );
}
