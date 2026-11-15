
import React from "react";
import type { Alert, Tab } from "../types";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Trash2,
  Clock3,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { motion } from "motion/react";

interface AlertsCenterViewProps {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  setActiveTab: (tab: Tab) => void;
}

const severityStyles: Record<string, string> = {
  Severe: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function SeverityIcon({ level }: { level: string }) {
  switch (level) {
    case "Severe":
      return <AlertCircle className="h-5 w-5 text-rose-600" />;
    case "High":
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case "Medium":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    default:
      return <Info className="h-5 w-5 text-[#557C91]" />;
  }
}

function AlertCard({
  alert,
  onMarkRead,
}: {
  alert: Alert;
  onMarkRead: (id: string) => void;
}) {
  const severityClass =
    severityStyles[alert.riskLevel] ||
    "bg-[#F0F5EE] text-[#52665A] border-[#DCE4DA]";

  return (
    <article className="rounded-2xl border border-[#E1E7DF] bg-white p-4 shadow-sm transition-colors hover:border-[#B8CCB9] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F6F8F3]">
          <SeverityIcon level={alert.riskLevel} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="break-words text-sm font-semibold text-[#183D32]">
              {alert.title}
            </h3>

            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${severityClass}`}
            >
              {alert.riskLevel}
            </span>
          </div>

          <p className="mt-2 break-words text-sm leading-6 text-[#66766B]">
            {alert.message}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#EEF1EB] pt-3 text-xs text-[#829287]">
            <span className="flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5" />
              {alert.category}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {alert.timestamp}
            </span>
          </div>
        </div>

        {!alert.read && (
          <button
            type="button"
            onClick={() => onMarkRead(alert.id)}
            title="Mark as read"
            aria-label={`Mark ${alert.title} as read`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DCE4DA] text-[#718076] transition-colors hover:border-[#8DB49A] hover:bg-[#F0F6F0] hover:text-[#315C47]"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE4DA] bg-[#FAFBF8] px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4EC] text-[#829287]">
        <Bell className="h-7 w-7" />
      </div>

      <h3 className="mt-4 font-semibold text-[#354B3D]">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[#829287]">
        {detail}
      </p>
    </div>
  );
}

export default function AlertsCenterView({
  alerts,
  onMarkRead,
  onClearAll,
  setActiveTab,
}: AlertsCenterViewProps) {
  const unreadAlerts = alerts.filter((alert) => !alert.read);
  const readAlerts = alerts.filter((alert) => alert.read);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto bg-[#F4F5F0] p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page heading */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#557C62]">
              FARM MONITORING
            </p>

            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#183D32] sm:text-3xl">
              <Bell className="h-7 w-7 text-[#477C62]" />
              Alerts Center
            </h1>

            <p className="mt-2 text-sm text-[#718076]">
              Review recorded alerts and monitor reported farm conditions.
            </p>
          </div>

          {alerts.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E8D8D5] bg-white px-4 py-2.5 text-sm font-medium text-[#A34B43] transition-colors hover:bg-[#FFF6F5]"
            >
              <Trash2 className="h-4 w-4" />
              Clear all alerts
            </button>
          )}
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E1E7DF] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#718076]">
                Unread alerts
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8] text-[#B96D36]">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold text-[#183D32]">
              {unreadAlerts.length}
            </p>

            <p className="mt-1 text-xs text-[#829287]">
              Recorded alerts not yet marked as read
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E7DF] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#718076]">
                Read alerts
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF4EC] text-[#477C62]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold text-[#183D32]">
              {readAlerts.length}
            </p>

            <p className="mt-1 text-xs text-[#829287]">
              Alerts previously marked as read
            </p>
          </div>
        </div>

        {/* No alerts */}
        {alerts.length === 0 ? (
          <EmptyState
            title="No alerts recorded"
            detail="No alert records have been supplied to this dashboard. This does not confirm that farms or connected devices are operating normally."
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">

            {/* Unread alerts */}
            <section className="space-y-4 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[#183D32]">
                    Unread alerts
                  </h2>
                  <p className="mt-1 text-xs text-[#829287]">
                    Recorded alerts awaiting review
                  </p>
                </div>

                <span className="rounded-full bg-[#EDF4EC] px-3 py-1.5 text-xs font-semibold text-[#477C62]">
                  {unreadAlerts.length} unread
                </span>
              </div>

              {unreadAlerts.length === 0 ? (
                <EmptyState
                  title="No unread alerts"
                  detail="All currently recorded alerts have been marked as read. This does not mean the underlying farm conditions have been resolved."
                />
              ) : (
                <div className="space-y-3">
                  {unreadAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onMarkRead={onMarkRead}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Read alerts */}
            <section className="space-y-4">
              <div>
                <h2 className="font-semibold text-[#183D32]">
                  Alert history
                </h2>
                <p className="mt-1 text-xs text-[#829287]">
                  Previously read alert records
                </p>
              </div>

              {readAlerts.length === 0 ? (
                <EmptyState
                  title="No read alerts"
                  detail="There are no alerts marked as read in the available records."
                />
              ) : (
                <div className="space-y-3">
                  {readAlerts.map((alert) => (
                    <article
                      key={alert.id}
                      className="rounded-2xl border border-[#E1E7DF] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F5EE]">
                          <Check className="h-4 w-4 text-[#477C62]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-semibold text-[#354B3D]">
                            {alert.title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-[#829287]">
                            {alert.category}
                          </p>

                          <p className="mt-2 text-[11px] text-[#9AA79D]">
                            Marked as read · {alert.timestamp}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Navigation */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E7DF] pt-5">
          <p className="text-xs text-[#829287]">
            Displaying {alerts.length} alert records supplied to EnFarm.
          </p>

          <button
            type="button"
            onClick={() => setActiveTab("DASHBOARD" as Tab)}
            className="text-sm font-semibold text-[#315C47] transition-colors hover:text-[#183D32] hover:underline"
          >
            Return to Home
          </button>
        </footer>
      </div>
    </motion.div>
  );
}
