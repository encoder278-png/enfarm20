
import { useMemo } from 'react';
import {
  Users,
  MapPin,
  Leaf,
  Bug,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Camera,
  MessageCircle,
  History,
  FileText,
  Activity,
  Sprout,
  ShieldCheck,
} from 'lucide-react';

import type {
  AnalysisRecord,
  Alert,
  FarmerProfile,
  Tab,
} from './types';

interface DashboardViewProps {
  farmers: FarmerProfile[];
  analyses: AnalysisRecord[];
  alerts: Alert[];
  setActiveTab: (tab: Tab) => void;
}

const riskStyles: Record<string, string> = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Severe: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#E1E7DF] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDEFE4] text-[#183D32]">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-[#183D32]">{title}</h2>
        {detail && (
          <p className="mt-1 text-sm text-[#718076]">{detail}</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`min-w-0 rounded-2xl border border-[#E1E7DF] bg-white p-5 text-left shadow-sm ${
        onClick
          ? 'transition-colors hover:border-[#8DB49A] hover:bg-[#FBFCF9]'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#718076]">{title}</span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5EE] text-[#315C47]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#183D32]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[#718076]">{detail}</p>
    </button>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DCE4DA] bg-[#FAFBF8] px-4 py-8 text-center">
      <div className="mb-3 text-[#829287]">{icon}</div>
      <p className="font-medium text-[#354B3D]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[#718076]">{detail}</p>
    </div>
  );
}

function AlertSymbol({ level }: { level: string }) {
  if (level === 'High' || level === 'Severe') {
    return <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />;
  }

  if (level === 'Medium') {
    return <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />;
  }

  return <Info className="h-5 w-5 shrink-0 text-[#557C91]" />;
}

export default function DashboardView({
  farmers,
  analyses,
  alerts,
  setActiveTab,
}: DashboardViewProps) {
  const uniqueRegions = useMemo(() => {
    return new Set(
      farmers
        .map((farmer) => farmer.region?.trim())
        .filter((region): region is string => Boolean(region))
    ).size;
  }, [farmers]);

  const diseaseCounts = useMemo(() => {
    const counts = new Map<string, number>();

    analyses.forEach((analysis) => {
      const diagnosis = analysis.diagnose?.trim();

      if (
        diagnosis &&
        !['unknown', 'pending', 'not available', 'n/a'].includes(
          diagnosis.toLowerCase()
        )
      ) {
        counts.set(diagnosis, (counts.get(diagnosis) || 0) + 1);
      }
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [analyses]);

  const riskCounts = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };

    analyses.forEach((analysis) => {
      if (analysis.riskLevel === 'Low') counts.Low += 1;
      else if (analysis.riskLevel === 'Medium') counts.Medium += 1;
      else if (analysis.riskLevel === 'High') counts.High += 1;
    });

    return counts;
  }, [analyses]);

  const recentAlerts = alerts.slice(0, 4);
  const highRiskCount = riskCounts.High;

  return (
    <div className="h-full overflow-y-auto bg-[#F4F5F0] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        
<header className="relative isolate overflow-hidden rounded-2xl bg-[#183D32]">
  <img
    src="images/african-farmers.jpg"
    alt=""
    aria-hidden="true"
    className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
  />

  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102E25]/95 via-[#183D32]/75 to-[#183D32]/20" />

  <div className="flex min-h-[260px] flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end sm:p-9">
    <div className="max-w-2xl">
      <p className="text-sm font-semibold tracking-[0.18em] text-[#DDEFE4]">
        ENFARM · SMART AGRICULTURE
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Better farming starts with better information.
      </h1>

      <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
        Monitor recorded crop analyses, review alerts, and connect with
        farmers through one agricultural support platform.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setActiveTab('UPLOAD_ANALYSIS' as Tab)}
      className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#183D32] transition-colors hover:bg-[#DDEFE4]"
    >
      <Camera className="h-4 w-4" />
      Analyse a crop
    </button>
  </div>
</header>

          <div>
            <p className="text-sm font-medium text-[#557C62]">
              ENFARM CONTROL CENTRE
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#183D32]">
              Home
            </h1>
            <p className="mt-2 text-sm text-[#718076]">
              Monitor recorded activity and access your farm support tools.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCE4DA] bg-white px-3 py-2 text-sm text-[#52665A]">
            <Activity className="h-4 w-4 text-[#557C62]" />
            Live data status not verified
          </div>
        </header>

        {/* Summary metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Farmer records"
            value={farmers.length}
            detail="Profiles currently returned by the database"
            icon={<Users className="h-5 w-5" />}
            onClick={() => setActiveTab('WHATSAPP_CHAT' as Tab)}
          />

          <MetricCard
            title="Regions recorded"
            value={uniqueRegions}
            detail="Distinct regions in farmer profiles"
            icon={<MapPin className="h-5 w-5" />}
          />

          <MetricCard
            title="Crop analyses"
            value={analyses.length}
            detail="Diagnosis records currently available"
            icon={<Leaf className="h-5 w-5" />}
            onClick={() => setActiveTab('ANALYSIS_RESULTS' as Tab)}
          />

          <MetricCard
            title="High-risk records"
            value={highRiskCount}
            detail="Analyses marked High risk"
            icon={<Bug className="h-5 w-5" />}
            onClick={() => setActiveTab('ANALYSIS_RESULTS' as Tab)}
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <SectionHeading
              icon={<Activity className="h-5 w-5" />}
              title="System overview"
              detail="Current information available to this dashboard"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F6F8F3] p-4">
                <div className="flex items-center gap-2 text-sm text-[#718076]">
                  <ShieldCheck className="h-4 w-4" />
                  Database records
                </div>
                <p className="mt-2 font-semibold text-[#183D32]">
                  {farmers.length + analyses.length} records displayed
                </p>
                <p className="mt-1 text-xs leading-5 text-[#718076]">
                  This counts the farmer profiles and analysis records supplied
                  to the dashboard, not all records in every system.
                </p>
              </div>

              <div className="rounded-xl bg-[#F6F8F3] p-4">
                <div className="flex items-center gap-2 text-sm text-[#718076]">
                  <AlertTriangle className="h-4 w-4" />
                  Alert records
                </div>
                <p className="mt-2 font-semibold text-[#183D32]">
                  {alerts.length} available
                </p>
                <p className="mt-1 text-xs leading-5 text-[#718076]">
                  Alert delivery and hardware connectivity have not been
                  verified by this count.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#E8ECE5] pt-5">
              <h3 className="mb-3 font-semibold text-[#183D32]">
                Quick actions
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('UPLOAD_ANALYSIS' as Tab)}
                  className="flex items-center gap-3 rounded-xl border border-[#DCE4DA] p-4 text-left transition-colors hover:bg-[#F6F8F3]"
                >
                  <Camera className="h-5 w-5 text-[#315C47]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[#183D32]">
                      Camera / Live
                    </span>
                    <span className="mt-1 block text-sm text-[#718076]">
                      Open crop image analysis
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#829287]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('WHATSAPP_CHAT' as Tab)}
                  className="flex items-center gap-3 rounded-xl border border-[#DCE4DA] p-4 text-left transition-colors hover:bg-[#F6F8F3]"
                >
                  <MessageCircle className="h-5 w-5 text-[#315C47]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[#183D32]">
                      WhatsApp
                    </span>
                    <span className="mt-1 block text-sm text-[#718076]">
                      View available farmer conversations
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#829287]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('HISTORY' as Tab)}
                  className="flex items-center gap-3 rounded-xl border border-[#DCE4DA] p-4 text-left transition-colors hover:bg-[#F6F8F3]"
                >
                  <History className="h-5 w-5 text-[#315C47]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[#183D32]">
                      History
                    </span>
                    <span className="mt-1 block text-sm text-[#718076]">
                      Review recorded analyses
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#829287]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ANALYSIS_RESULTS' as Tab)}
                  className="flex items-center gap-3 rounded-xl border border-[#DCE4DA] p-4 text-left transition-colors hover:bg-[#F6F8F3]"
                >
                  <FileText className="h-5 w-5 text-[#315C47]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[#183D32]">
                      Reports
                    </span>
                    <span className="mt-1 block text-sm text-[#718076]">
                      Open available analysis results
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#829287]" />
                </button>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <SectionHeading
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Recent alerts"
                detail="Alerts provided to the dashboard"
              />
              <button
                type="button"
                onClick={() => setActiveTab('ALERTS_CENTER' as Tab)}
                className="shrink-0 text-sm font-medium text-[#315C47] hover:underline"
              >
                View all
              </button>
            </div>

            {recentAlerts.length === 0 ? (
              <EmptyState
                icon={<Info className="h-7 w-7" />}
                title="No alert records available"
                detail="This does not confirm that the farm or connected devices are safe. An alert feed has not supplied any records."
              />
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-xl border border-[#E8ECE5] p-3"
                  >
                    <AlertSymbol level={alert.riskLevel} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-[#273D30]">
                        {alert.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#718076]">
                        {alert.message}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                          riskStyles[alert.riskLevel] ||
                          'border-[#DCE4DA] bg-[#F6F8F3] text-[#52665A]'
                        }`}
                      >
                        {alert.riskLevel} risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Diagnosis summaries */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeading
              icon={<Sprout className="h-5 w-5" />}
              title="Most recorded diagnoses"
              detail="Ranked by the number of available analysis records"
            />

            {diseaseCounts.length === 0 ? (
              <EmptyState
                icon={<Leaf className="h-7 w-7" />}
                title="No diagnosis summary yet"
                detail="A summary will appear when valid diagnosis records are available."
              />
            ) : (
              <div className="space-y-4">
                {diseaseCounts.map(([name, count]) => {
                  const percentage =
                    analyses.length > 0
                      ? Math.round((count / analyses.length) * 100)
                      : 0;

                  return (
                    <div key={name}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="break-words font-medium text-[#354B3D]">
                          {name}
                        </span>
                        <span className="shrink-0 text-[#718076]">
                          {count} record{count === 1 ? '' : 's'} · {percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#EAF0E8]">
                        <div
                          className="h-full rounded-full bg-[#477C62]"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-xs text-[#829287]">
              Counts are based on available analysis records, not a survey of
              all farms.
            </p>
          </Card>

          <Card>
            <SectionHeading
              icon={<Bug className="h-5 w-5" />}
              title="Risk distribution"
              detail="Risk labels in the available analysis records"
            />

            {analyses.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-7 w-7" />}
                title="No risk data available"
                detail="Risk distribution will appear when analysis records are available."
              />
            ) : (
              <div className="space-y-5">
                {(
                  [
                    ['Low', riskCounts.Low, 'bg-emerald-600'],
                    ['Medium', riskCounts.Medium, 'bg-amber-500'],
                    ['High', riskCounts.High, 'bg-red-600'],
                  ] as const
                ).map(([label, count, color]) => {
                  const percentage = Math.round(
                    (count / analyses.length) * 100
                  );

                  return (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#354B3D]">
                          {label} risk
                        </span>
                        <span className="text-[#718076]">
                          {count} · {percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#EAF0E8]">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('ANALYSIS_RESULTS' as Tab)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#315C47] hover:underline"
            >
              Review analysis records
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>
        </div>

        <footer className="pb-3 text-center text-xs text-[#829287]">
          EnFarm · Dashboard summaries depend on the data supplied by connected services.
        </footer>
      </div>
    </div>
  );
}
