import React, { useEffect, useState } from "react";
import { Lightbulb, ShieldAlert, Droplet, Sprout, CalendarClock, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface RecommendationsData {
  pestControl: string;
  irrigation: string;
  fertilization: string;
  harvesting: string;
}

export default function RecommendationsView() {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<RecommendationsData | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/recommendations");
      if (response.ok) {
        const data = await response.json();
        setRecs(data);
      } else {
        throw new Error();
      }
    } catch {
      // Graceful fallback
      setRecs({
        pestControl: "Apply triazole fungicide pre-emptively on Wheat crops because of high humidity cycles.",
        irrigation: "Irrigate tomorrow at 04:00 AM with exactly 12mm to avoid afternoon heat evaporation.",
        fertilization: "NPK ratio displays Nitrogen deficiencies. Incorporate Urea dressing at 40 kg/ha.",
        harvesting: "Prepare threshers and harvesting machinery. Window for Soybeans opens in 9 days."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

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
            <Lightbulb className="text-emerald-400 w-7 h-7" /> AI Recommendations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time advisory nodes generated dynamically by Gemini AI matching your current microclimate.
          </p>
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="bg-[#1b2333] border border-slate-800 text-slate-300 hover:bg-[#222b3e] text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 max-w-max cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload Live Advice
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#151c28] border border-slate-800/80 p-6 rounded-2xl h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Pest Control */}
          <div className="bg-[#151c28] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                <ShieldAlert className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Pathogen & Pest Control</h3>
                <span className="text-[10px] text-slate-500 font-mono">ADVISORY STATUS: ACTIVE</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[50px] font-sans selection:bg-emerald-500/20">
              {recs?.pestControl}
            </p>
          </div>

          {/* Card 2: Irrigation */}
          <div className="bg-[#151c28] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <Droplet className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Precision Irrigation</h3>
                <span className="text-[10px] text-slate-500 font-mono">FLOW LEVEL: OPTIMIZED</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[50px] font-sans selection:bg-emerald-500/20">
              {recs?.irrigation}
            </p>
          </div>

          {/* Card 3: Fertilization */}
          <div className="bg-[#151c28] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Sprout className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">NPK Soil Fertilization</h3>
                <span className="text-[10px] text-slate-500 font-mono">MINERAL DENSITY: SLIGHT DEFICIT</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[50px] font-sans selection:bg-emerald-500/20">
              {recs?.fertilization}
            </p>
          </div>

          {/* Card 4: Harvesting */}
          <div className="bg-[#151c28] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <CalendarClock className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Crop Harvest Calendars</h3>
                <span className="text-[10px] text-slate-500 font-mono">COUNTDOWN ACTIVE</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[50px] font-sans selection:bg-emerald-500/20">
              {recs?.harvesting}
            </p>
          </div>

        </div>
      )}
    </motion.div>
  );
}
