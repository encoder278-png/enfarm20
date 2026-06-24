import React, { useState } from "react";
import { FarmSettings, Tab } from "../types";
import { Settings, Save, Sparkles, Key, Check, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { motion } from "motion/react";

interface SettingsViewProps {
  settings: FarmSettings;
  onSaveSettings: (settings: FarmSettings) => void;
}

export default function SettingsView({ settings, onSaveSettings }: SettingsViewProps) {
  const [farmName, setFarmName] = useState(settings.farmName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [location, setLocation] = useState(settings.location);
  const [farmSize, setFarmSize] = useState(settings.farmSizeAcres);
  const [soilType, setSoilType] = useState(settings.soilType);
  const [irrigation, setIrrigation] = useState(settings.irrigationMethod);
  const [autoAlerts, setAutoAlerts] = useState(settings.autoAlertsEnabled);
  const [apiGrounding, setApiGrounding] = useState(settings.apiGroundingEnabled);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      farmName,
      ownerName,
      location,
      farmSizeAcres: farmSize,
      primaryCrops: settings.primaryCrops,
      soilType,
      irrigationMethod: irrigation,
      autoAlertsEnabled: autoAlerts,
      apiGroundingEnabled: apiGrounding
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

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
          <Settings className="text-emerald-400 w-7 h-7" /> Settings & Configuration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure farm sizes, adjust alert thresholds, and review agricultural sensor integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Farm settings form (8 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-[#151c28] border border-slate-800 p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-3 font-display">Farm Demographics</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Farm Name Identifier</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-[#0d121c] border border-slate-800 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Primary Operator Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-[#0d121c] border border-slate-800 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">GIS Coordinates / Regional Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#0d121c] border border-slate-800 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium font-sans">Total Size (Acres)</label>
              <input
                type="number"
                value={farmSize}
                onChange={(e) => setFarmSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0d121c] border border-slate-800 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Soil Clay/Silt Consistency</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-[#0d121c] border border-slate-800 text-xs text-slate-350 pr-4 px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Loamy Silt">Loamy Silt (High Nitrogen retention)</option>
                <option value="Sandy Clay">Sandy Clay (Rapid drainage)</option>
                <option value="Silty Silt">Silty Silt (Standard moisture cap)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium font-sans">Irrigation System Method</label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
                className="w-full bg-[#0d121c] border border-slate-800 text-xs pr-4 px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Precision Drip Pivot">Precision Drip Pivot (Water conservative)</option>
                <option value="Overhead Lateral Sprinklers">Overhead Lateral Sprinklers</option>
                <option value="Surface Flooding Gate">Surface Flooding Gate</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-3 font-display pt-4">Automation Toggles</h3>

          <div className="space-y-3.5 font-sans">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-905/30 border border-slate-800 bg-[#0d121c]/45">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Critical Sensor Push Alerts</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Alert if temperature surpasses 32°C or moisture indices collapse.</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoAlerts(!autoAlerts)}
                className="text-emerald-400 cursor-pointer text-slate-400 hover:text-white"
              >
                {autoAlerts ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-905/30 border border-slate-800 bg-[#0d121c]/45">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Google Search Grounding Synced</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Augments chatbot replies with dynamic global agriculture event logs.</span>
              </div>
              <button
                type="button"
                onClick={() => setApiGrounding(!apiGrounding)}
                className="text-emerald-400 cursor-pointer text-slate-400 hover:text-white"
              >
                {apiGrounding ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Synced Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Demographics</span>
              </>
            )}
          </button>
        </form>

        {/* Secret guidance panel (4 cols) */}
        <div className="lg:col-span-4 bg-[#151c28] border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Full-Stack API Integrations</h3>
          </div>

          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/40 space-y-3">
            <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest block uppercase">Telemetry Setup Code</span>
            <p className="text-xs text-slate-400 leading-relaxed font-sans select-text">
              We have completed full-stack modular structures with custom Express services proxying requests elegantly to the latest Google GenAI model.
            </p>
            <p className="text-[11px] text-slate-400 font-normal leading-normal font-sans pt-1 select-text">
              To trigger actual AI insights inside **AI Assistant** or **Upload Leaf Pathology**, add your Gemini API key in the AI Studio Settings panel:
            </p>
            
            <div className="bg-[#0b0e14] p-3 rounded-lg border border-slate-800 text-center text-xs text-emerald-400 selection:bg-emerald-500/20 py-2.5 font-mono select-all">
              GEMINI_API_KEY
            </div>

            <p className="text-[11px] text-slate-450 text-slate-400 flex items-start gap-1.5 leading-normal pt-1.5 select-text">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>We set up your API key automatically. You can review and update this configuration in the **Settings &gt; Secrets** panel in Google AI Studio anytime.</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
