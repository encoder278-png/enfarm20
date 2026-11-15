
import React, { useMemo } from "react";
import { AnalysisRecord, FarmerProfile } from "../types";
import {
  FileText,
  Users,
  Leaf,
  Activity,
  AlertTriangle,
  CalendarDays,
  ArrowUpRight
} from "lucide-react";

interface ReportsViewProps {
  analyses: AnalysisRecord[];
  farmers: FarmerProfile[];
  onSelectAnalysis: (record: AnalysisRecord) => void;
}

export default function ReportsView({
  analyses,
  farmers,
  onSelectAnalysis
}: ReportsViewProps) {
  const cropGroups = useMemo(() => {
    return analyses.reduce<Record<string, number>>((groups, record) => {
      const crop = record.cropType?.trim() || "Crop not recorded";
      groups[crop] = (groups[crop] || 0) + 1;
      return groups;
    }, {});
  }, [analyses]);

  const riskGroups = useMemo(() => ({
    high: analyses.filter((a) => a.riskLevel === "High").length,
    medium: analyses.filter((a) => a.riskLevel === "Medium").length,
    low: analyses.filter((a) => a.riskLevel === "Low").length,
    unknown: analyses.filter((a) => a.riskLevel === "Unknown").length
  }), [analyses]);

  const recentReports = [...analyses].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`).getTime();
    const dateB = new Date(`${b.date} ${b.time}`).getTime();
    return (Number.isFinite(dateB) ? dateB : 0) -
      (Number.isFinite(dateA) ? dateA : 0);
  });

  return (
    <div className="h-full overflow-y-auto bg-[#F4F6F2] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#718477]">
            EnFarm workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#183D32]">
            Reports
          </h1>
          <p className="mt-2 text-sm text-[#718076]">
            Reports generated from recorded farmer and crop assessments.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            icon={<FileText size={20} />}
            label="Recorded assessments"
            value={analyses.length}
          />

          <SummaryCard
            icon={<Users size={20} />}
            label="Registered farmer records"
            value={farmers.length}
          />

          <SummaryCard
            icon={<Leaf size={20} />}
            label="Crop categories recorded"
            value={Object.keys(cropGroups).length}
          />

          <SummaryCard
            icon={<AlertTriangle size={20} />}
            label="High-risk assessments"
            value={riskGroups.high}
          />

        </div>

        {/* Crop breakdown */}
        <section className="rounded-2xl border border-[#E1E7DF] bg-white p-6">
          <div className="flex items-center gap-3">
            <Leaf className="text-[#47785A]" size={20} />
            <div>
              <h2 className="font-semibold text-[#243B31]">
                Crop assessment breakdown
              </h2>
              <p className="mt-1 text-xs text-[#819087]">
                Based on recorded assessments only.
              </p>
            </div>
          </div>

          {Object.keys(cropGroups).length === 0 ? (
            <EmptyState message="No crop assessments have been recorded yet." />
          ) : (
            <div className="mt-6 space-y-4">
              {Object.entries(cropGroups).map(([crop, count]) => (
                <div key={crop}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-[#344B3E]">{crop}</span>
                    <span className="text-[#718076]">{count} assessments</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EDF1EC]">
                    <div
                      className="h-full rounded-full bg-[#47785A]"
                      style={{
                        width: `${analyses.length
                          ? (count / analyses.length) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Risk breakdown */}
        <section className="rounded-2xl border border-[#E1E7DF] bg-white p-6">
          <div className="flex items-center gap-3">
            <Activity className="text-[#47785A]" size={20} />
            <div>
              <h2 className="font-semibold text-[#243B31]">
                Assessment risk levels
              </h2>
              <p className="mt-1 text-xs text-[#819087]">
                Risk classifications returned in saved assessments.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "High", value: riskGroups.high },
              { label: "Medium", value: riskGroups.medium },
              { label: "Low", value: riskGroups.low },
              { label: "Unknown", value: riskGroups.unknown }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-[#F5F7F3] p-4"
              >
                <p className="text-xs text-[#718076]">{item.label} risk</p>
                <p className="mt-2 text-2xl font-bold text-[#243B31]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent reports */}
        <section className="rounded-2xl border border-[#E1E7DF] bg-white p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-[#47785A]" size={20} />
            <div>
              <h2 className="font-semibold text-[#243B31]">
                Recorded assessments
              </h2>
              <p className="mt-1 text-xs text-[#819087]">
                Open an assessment to view its full details.
              </p>
            </div>
          </div>

          {recentReports.length === 0 ? (
            <EmptyState message="No saved assessments are available for reporting." />
          ) : (
            <div className="mt-5 divide-y divide-[#EDF0EB]">
              {recentReports.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => onSelectAnalysis(record)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-[#F8FAF7]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#243B31]">
                      {record.title || record.cropType}
                    </p>
                    <p className="mt-1 text-xs text-[#819087]">
                      {record.cropType} · {record.date} · {record.time}
                    </p>
                    <p className="mt-1 text-xs text-[#718076]">
                      {record.diagnose}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-[#EDF3EC] px-3 py-1 text-xs font-medium text-[#47785A]">
                      {record.riskLevel}
                    </span>
                    <ArrowUpRight size={17} className="text-[#718076]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#E1E7DF] bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2EA] text-[#47785A]">
        {icon}
      </div>
      <p className="mt-4 text-2xl font-bold text-[#243B31]">{value}</p>
      <p className="mt-1 text-xs text-[#819087]">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <FileText className="mx-auto text-[#A4B0A5]" size={30} />
      <p className="mt-3 text-sm text-[#718076]">{message}</p>
    </div>
  );
}
