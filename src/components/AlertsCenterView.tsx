import React from "react";
import { Alert, Tab } from "../types";
import { Bell, AlertTriangle, AlertCircle, Info, Check, Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface AlertsCenterViewProps {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  setActiveTab: (tab: Tab) => void;
}

export default function AlertsCenterView({
  alerts,
  onMarkRead,
  onClearAll,
  setActiveTab
}: AlertsCenterViewProps) {
  
  const unreadAlerts = alerts.filter(a => !a.read);
  const readAlerts = alerts.filter(a => a.read);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "Severe":
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case "High":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-sky-400" />;
    }
  };

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
            <Bell className="text-emerald-400 w-7 h-7" /> Alerts & Threat Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track urgent anomalies reported by farm sensor grids and localized drone runs.
          </p>
        </div>
        
        {alerts.length > 0 && (
          <button
            onClick={onClearAll}
            className="bg-[#1b2333] border border-slate-800 text-slate-350 hover:bg-[#222b3e] text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 max-w-max cursor-pointer text-slate-300"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Clear Selected Logs
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 text-center bg-[#151c28] border border-slate-800 rounded-2xl">
          <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-white text-lg font-bold">All clear! No threats flagged</h3>
          <p className="text-slate-400 text-sm mt-1">Active microclimates are completely steady and fully hydrated.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Active unread threats (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Active Threats ({unreadAlerts.length})
            </h3>

            {unreadAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 bg-slate-900/40 border border-slate-800/40 rounded-xl">
                No active severe alerts flagged in microclimate segments.
              </p>
            ) : (
              <div className="space-y-3">
                {unreadAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-4 bg-slate-950/20 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl flex gap-4 items-start relative overflow-hidden group hover:bg-[#192233]/40 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {getAlertIcon(alert.riskLevel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-slate-200 block">{alert.title}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          alert.riskLevel === 'Severe' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          alert.riskLevel === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {alert.riskLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-405 mt-1 leading-relaxed text-slate-400">{alert.message}</p>
                      <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-mono">
                        <span>Category: {alert.category}</span>
                        <span>Logged {alert.timestamp}</span>
                      </div>
                    </div>
                    
                    {/* Action pill: mark as read */}
                    <button
                      onClick={() => onMarkRead(alert.id)}
                      className="ml-2 bg-[#1c2636] hover:bg-emerald-500 hover:text-slate-950 p-2 rounded-lg text-slate-400 transition-colors shrink-0 cursor-pointer self-center"
                      title="Mark as addressed"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical/Read logs (4 cols) */}
          <div className="lg:col-span-4 bg-[#151c28] border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-350 text-slate-200">History Log ({readAlerts.length})</h3>
            
            {readAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No cleared logs recorded this season.</p>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {readAlerts.map(alert => (
                  <div key={alert.id} className="p-3 bg-slate-900/20 border border-slate-800/40 rounded-xl opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 line-through">{alert.title}</span>
                      <span className="text-[9px] font-mono text-slate-500">{alert.category}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 block">Closed • {alert.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
}
