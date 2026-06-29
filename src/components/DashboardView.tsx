import { useMemo } from 'react';
import {
  Users,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Info,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  ArrowRight,
  Leaf,
  Bug,
  CloudSun,
  BarChart2,
  Bell,
} from 'lucide-react';
import type { AnalysisRecord, Alert, FarmerProfile, Tab } from './types';

// NOTE: This is the CONTENT-ONLY version of Bolt's dashboard.
// The <aside> sidebar and <header> top bar from Bolt's original output
// have been removed, because your real App.tsx already provides those
// via <Sidebar /> and its own <header>. Dropping in Bolt's full-page
// version as-is would have nested a second sidebar/header inside your
// existing ones.
//
// setActiveTab has been restored so cards can navigate between tabs,
// matching how your original DashboardView worked.

interface DashboardViewProps {
  farmers: FarmerProfile[];
  analyses: AnalysisRecord[];
  alerts: Alert[];
  setActiveTab: (tab: Tab) => void;
}

const DONUT_COLORS = [
  '#12c481', // emerald green
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#f97316', // orange
  '#14b8a6', // teal
  '#6b7280', // gray (others)
];

const WEATHER_POINTS = [22, 21, 23, 24, 22, 23, 21];
const WEATHER_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function buildArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startDeg - 90));
  const sy = cy + r * Math.sin(toRad(startDeg - 90));
  const ex = cx + r * Math.cos(toRad(endDeg - 90));
  const ey = cy + r * Math.sin(toRad(endDeg - 90));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

function DonutChartV2({
  segments,
  total,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; count: number; color: string }[];
  total: number;
  centerLabel: string;
  centerSub: string;
}) {
  const size = 170;
  const cx = size / 2;
  const cy = size / 2;
  const r = 62;
  const strokeWidth = 24;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.count / total : 0;
    const span = pct * 360;
    const start = cumulative;
    cumulative += span;
    const d = span > 0.5 ? buildArc(cx, cy, r, start, cumulative) : '';
    return { ...seg, d };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2736" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) =>
        arc.d ? (
          <path
            key={i}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ) : null
      )}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="inherit">
        {centerLabel}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#f1f5f9" fontSize="26" fontWeight="700" fontFamily="inherit">
        {total}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="inherit">
        {centerSub}
      </text>
    </svg>
  );
}

function WeatherSparkline() {
  const w = 340;
  const h = 80;
  const pad = 10;
  const vals = WEATHER_POINTS;
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const xs = vals.map((_, i) => pad + (i / (vals.length - 1)) * (w - pad * 2));
  const ys = vals.map((v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2));

  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const fill = `${path} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`;

  const peakIdx = vals.indexOf(Math.max(...vals));

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sparkGrad)" />
      <path d={path} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
      <rect
        x={xs[peakIdx] - 22}
        y={ys[peakIdx] - 22}
        width="44"
        height="18"
        rx="4"
        fill="#1e2736"
        stroke="#06b6d4"
        strokeWidth="1"
      />
      <text
        x={xs[peakIdx]}
        y={ys[peakIdx] - 9}
        textAnchor="middle"
        fill="#06b6d4"
        fontSize="10"
        fontWeight="600"
        fontFamily="inherit"
      >
        {Math.max(...vals)}°C
      </text>
      <circle cx={xs[peakIdx]} cy={ys[peakIdx]} r="4" fill="#06b6d4" />
      {WEATHER_DAYS.map((day, i) => (
        <text
          key={day}
          x={xs[i]}
          y={h - 1}
          textAnchor="middle"
          fill={i === peakIdx ? '#06b6d4' : '#4b5563'}
          fontSize="9"
          fontFamily="inherit"
          fontWeight={i === peakIdx ? '600' : '400'}
        >
          {day}
        </text>
      ))}
    </svg>
  );
}

function riskBadgeStyle(level: string) {
  switch (level) {
    case 'High':
    case 'Severe':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'Medium':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'Low':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

function AlertIcon({ level }: { level: string }) {
  if (level === 'High' || level === 'Severe')
    return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
  if (level === 'Medium')
    return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
  return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
}

export default function DashboardView({ farmers, analyses, alerts, setActiveTab }: DashboardViewProps) {
  const totalFarmers = farmers.length;
  const totalAnalyses = analyses.length;

  const uniqueRegions = useMemo(() => {
    const set = new Set(farmers.map((f) => f.region).filter(Boolean));
    return set.size;
  }, [farmers]);

  const diseaseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) => {
      if (a.diagnose) {
        map[a.diagnose] = (map[a.diagnose] || 0) + 1;
      }
    });
    return map;
  }, [analyses]);

  const diseaseSegments = useMemo(() => {
    const sorted = Object.entries(diseaseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topTotal = sorted.reduce((s, [, c]) => s + c, 0);
    const othersCount = totalAnalyses - topTotal;
    const segs = sorted.map(([label, count], i) => ({
      label,
      count,
      color: DONUT_COLORS[i],
    }));
    if (othersCount > 0) {
      segs.push({ label: 'Others', count: othersCount, color: DONUT_COLORS[5] });
    }
    return segs;
  }, [diseaseCounts, totalAnalyses]);

  const riskCounts = useMemo(() => {
    const map: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
    analyses.forEach((a) => {
      map[a.riskLevel] = (map[a.riskLevel] || 0) + 1;
    });
    return map;
  }, [analyses]);

  const riskSegments = useMemo(() => [
    { label: 'Low', count: riskCounts['Low'] || 0, color: '#12c481' },
    { label: 'Medium', count: riskCounts['Medium'] || 0, color: '#f97316' },
    { label: 'High', count: riskCounts['High'] || 0, color: '#ef4444' },
  ], [riskCounts]);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kituo cha udhibiti cha EnFarm — Tanzania</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#12c481]/15 border border-[#12c481]/40 text-[#12c481] rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#12c481] animate-pulse" />
          Farm Status: Optimal
        </div>
      </div>

      {/* Row 1: Metric cards + Weather */}
      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('FARMERS' as Tab)}
          className="bg-[#151c28] border border-white/8 rounded-xl p-5 cursor-pointer hover:border-[#12c481]/40 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#12c481]/10 border border-[#12c481]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#12c481]" />
              </div>
              <span className="text-xs font-semibold text-[#12c481] tracking-widest uppercase">
                No. of Farmers
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
          {totalFarmers > 0 ? (
            <>
              <p className="text-4xl font-bold text-[#12c481] tabular-nums">
                {totalFarmers.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-2">Active farmer profiles</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-600">0</p>
              <p className="text-xs text-slate-600 mt-2">No farmers yet</p>
            </>
          )}
        </div>

        <div className="bg-[#151c28] border border-white/8 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#06b6d4]" />
              </div>
              <span className="text-xs font-semibold text-[#06b6d4] tracking-widest uppercase">
                No. of Regions
              </span>
            </div>
          </div>
          {uniqueRegions > 0 ? (
            <>
              <p className="text-4xl font-bold text-[#06b6d4] tabular-nums">{uniqueRegions}</p>
              <p className="text-xs text-slate-500 mt-2">Across Tanzania</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-600">0</p>
              <p className="text-xs text-slate-600 mt-2">No regions yet</p>
            </>
          )}
        </div>

        <div
          onClick={() => setActiveTab('WEATHER_INTELLIGENCE' as Tab)}
          className="bg-[#151c28] border border-white/8 rounded-xl p-5 cursor-pointer hover:border-cyan-500/40 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">Weather Overview</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">24°C</p>
          <p className="text-xs text-slate-500 mb-3">Sunny • humidity 48%</p>
          <WeatherSparkline />
        </div>
      </div>

      {/* Row 2: Donut charts + Alerts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#151c28] border border-white/8 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#12c481]" />
              <span className="text-sm font-semibold text-white">Common Diseases</span>
            </div>
          </div>
          {totalAnalyses === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Leaf className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No analyses yet</p>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <div className="shrink-0">
                <DonutChartV2
                  segments={diseaseSegments}
                  total={totalAnalyses}
                  centerLabel="Total"
                  centerSub="Analyses"
                />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {diseaseSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-xs text-slate-400 truncate flex-1">{seg.label}</span>
                    <span className="text-xs text-slate-300 font-medium shrink-0">
                      {totalAnalyses > 0 ? Math.round((seg.count / totalAnalyses) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-600 shrink-0">({seg.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-4">Based on {totalAnalyses} analyses</p>
        </div>

        <div className="bg-[#151c28] border border-white/8 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Risk Level Distribution</span>
            </div>
          </div>
          {totalAnalyses === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Bug className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No analyses yet</p>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <div className="shrink-0">
                <DonutChartV2
                  segments={riskSegments}
                  total={totalAnalyses}
                  centerLabel="Total"
                  centerSub="Detections"
                />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                {riskSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-xs text-slate-400 flex-1">{seg.label} Risk</span>
                    <span className="text-xs text-slate-300 font-medium shrink-0">
                      {totalAnalyses > 0 ? Math.round((seg.count / totalAnalyses) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-600 shrink-0">({seg.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-4">Based on {totalAnalyses} analyses</p>
        </div>

        <div
          onClick={() => setActiveTab('ALERTS_CENTER' as Tab)}
          className="bg-[#151c28] border border-white/8 rounded-xl p-5 flex flex-col cursor-pointer hover:border-amber-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">System Alerts & Errors</span>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No alerts</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#0d1117] border border-white/5">
                  <AlertIcon level={alert.riskLevel} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{alert.title}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{alert.message}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${riskBadgeStyle(alert.riskLevel)}`}>
                    {alert.riskLevel}
                  </span>
                </div>
              ))
            )}
          </div>
          {alerts.length > 0 && (
            <div className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-slate-400 py-2 border-t border-white/5">
              View All Alerts
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Analyses summary */}
      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('ANALYSIS_RESULTS' as Tab)}
          className="bg-[#151c28] border border-white/8 rounded-xl p-5 cursor-pointer hover:border-[#12c481]/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#12c481]" />
            <span className="text-sm font-semibold text-white">Total Analyses</span>
          </div>
          {totalAnalyses > 0 ? (
            <>
              <p className="text-4xl font-bold text-[#12c481] tabular-nums">{totalAnalyses}</p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12c481]" />
                  {analyses.filter((a) => a.status === 'Completed').length} Completed
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {analyses.filter((a) => a.status === 'Pending').length} Pending
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {analyses.filter((a) => a.status === 'Failed').length} Failed
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-600">0</p>
              <p className="text-xs text-slate-600 mt-2">No analyses yet</p>
            </>
          )}
        </div>

        <div className="bg-[#151c28] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[#06b6d4]" />
            <span className="text-sm font-semibold text-white">Avg. Health Score</span>
          </div>
          {totalAnalyses > 0 ? (
            <>
              <p className="text-4xl font-bold text-[#06b6d4] tabular-nums">
                {Math.round(analyses.reduce((s, a) => s + a.healthScore, 0) / totalAnalyses)}
                <span className="text-xl text-slate-500">%</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">Across all crop analyses</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-600">—</p>
              <p className="text-xs text-slate-600 mt-2">No data yet</p>
            </>
          )}
        </div>

        <div className="bg-[#151c28] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">High Risk Analyses</span>
          </div>
          {totalAnalyses > 0 ? (
            <>
              <p className="text-4xl font-bold text-red-400 tabular-nums">{riskCounts['High'] || 0}</p>
              <p className="text-xs text-slate-500 mt-2">
                {totalAnalyses > 0 ? Math.round(((riskCounts['High'] || 0) / totalAnalyses) * 100) : 0}% of total analyses
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-600">0</p>
              <p className="text-xs text-slate-600 mt-2">No analyses yet</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
