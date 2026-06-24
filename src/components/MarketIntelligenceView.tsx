import React, { useState } from "react";
import { MarketCropPrice } from "../types";
import { TrendingUp, DollarSign, Calculator, ChevronRight, BarChart3, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "motion/react";

interface MarketIntelligenceViewProps {
  prices: MarketCropPrice[];
}

export default function MarketIntelligenceView({ prices }: MarketIntelligenceViewProps) {
  const [selectedCropId, setSelectedCropId] = useState("soybeans");
  const [farmAcres, setFarmAcres] = useState(120);
  const [expYieldPerAcre, setExpYieldPerAcre] = useState(48); // e.g. 48 bushels/acre

  const activeCrop = prices.find((p) => p.id === selectedCropId) || prices[0];

  // Revenue calculation
  // Gross Revenue = Acres * Yield per Acre * Commodity Price
  const grossRevenue = farmAcres * expYieldPerAcre * activeCrop.price;
  const growthChangeAmount = (grossRevenue * activeCrop.changePercent) / 100;

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
          <TrendingUp className="text-emerald-400 w-7 h-7" /> Market Intelligence & Trading Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor crop futures, contract multipliers, and forecast localized harvest values instantly.
        </p>
      </div>

      {/* Index Summary (Grid of prices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {prices.map((crop) => {
          const isUp = crop.changePercent >= 0;
          const isSelected = crop.id === selectedCropId;
          
          return (
            <div
              key={crop.id}
              onClick={() => setSelectedCropId(crop.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isSelected 
                  ? "bg-[#1d2736]/90 border-slate-705/80 border-cyan-500/25 ring-1 ring-cyan-500/15" 
                  : "bg-[#151c28] border-slate-800/80 hover:bg-[#1e2736]/50 hover:border-slate-700/80"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{crop.name}</span>
                <span className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {isUp ? "+" : ""}{crop.changePercent}%
                </span>
              </div>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-display font-bold text-white">${crop.price}</span>
                <span className="text-[11px] text-slate-500 font-mono">/ {crop.unit}</span>
              </div>
              
              <div className="flex justify-between text-[10px] text-slate-500 mt-3 font-mono border-t border-slate-800/40 pt-2.5">
                <span>Vol: {crop.volume24h}</span>
                <span>Futures</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Commodity Analysis Graph Card (8 cols) */}
        <div className="lg:col-span-8 bg-[#151c28] border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-450 uppercase text-slate-400 font-mono">Commodity Node Tracker</span>
              <h2 className="text-lg font-display font-bold text-white mt-0.5">{activeCrop.name} Price Futures</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live CME Group Index</span>
          </div>

          {/* Historical price curve */}
          <div className="relative h-48 w-full bg-[#0d121c]/40 rounded-xl overflow-hidden p-4 border border-slate-800/20 flex flex-col justify-end">
            <div className="absolute left-4 right-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-slate-800/40 w-full" />
              <div className="border-t border-slate-800/40 w-full" />
              <div className="border-t border-slate-800/40 w-full" />
            </div>

            <svg className="w-full h-full absolute inset-x-0 bottom-6 px-10" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="market-single-cyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,90 Q 70,110 140,40 T 280,60 T 420,20 T 500,25 L 500,120 L 0,120 Z"
                fill="url(#market-single-cyan)"
              />
              <path
                d="M 0,90 Q 70,110 140,40 T 280,60 T 420,20 T 500,25"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
              <circle cx="140" cy="40" r="4.5" fill="#06b6d4" stroke="#151c28" strokeWidth="1.5" />
              <circle cx="420" cy="20" r="4.5" fill="#06b6d4" stroke="#151c28" strokeWidth="1.5" />
            </svg>

            {/* Price timeline index */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800/10 px-4">
              {activeCrop.history.map((pt, i) => (
                <span key={i}>{pt.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Harvest Revenue Forecasting Calculator (4 cols) */}
        <div className="lg:col-span-4 bg-[#151c28] border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-display">Contract Value Projection</h3>
          </div>

          <div className="space-y-4 font-sans text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-450 block text-slate-400 font-medium">Cultivated Farm Acres</label>
              <input
                type="number"
                value={farmAcres}
                onChange={(e) => setFarmAcres(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#0d121c] border border-slate-800 text-white font-mono px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-450 block text-slate-400 font-medium">Expected Bushels / Acre</label>
              <input
                type="number"
                value={expYieldPerAcre}
                onChange={(e) => setExpYieldPerAcre(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#0d121c] border border-slate-800 text-white font-mono px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Glowing outputs */}
          <div className="p-4 bg-gradient-to-br from-[#0c2e3a]/15 to-slate-900 border border-cyan-500/15 rounded-xl space-y-2 text-center text-sans bg-slate-900/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Projected Revenue Value</span>
            <span className="text-2xl font-display font-bold text-cyan-400 block">${grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wide flex items-center justify-center gap-1">
              Seasonal delta projection: +${growthChangeAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
