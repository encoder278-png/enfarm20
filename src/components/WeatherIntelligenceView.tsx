import React, { useState } from "react";
import { WeatherData } from "../types";
import { CloudSun, Sun, CloudRain, Droplets, Thermometer, Wind, Eye } from "lucide-react";
import { motion } from "motion/react";

interface WeatherIntelligenceViewProps {
  weather: WeatherData;
}

export default function WeatherIntelligenceView({ weather }: WeatherIntelligenceViewProps) {
  const [activeGeo, setActiveGeo] = useState("North Field Sector A");

  const sectors = ["North Field Sector A", "South Pivot Sector B", "East Orchard Sector C", "Wetlands Buffer D"];

  // Helper weather icon mapped to condition strings
  const getWeatherIcon = (cond: string) => {
    const term = cond.toLowerCase();
    if (term.includes("sun") || term.includes("clear")) return <Sun className="w-8 h-8 text-amber-400" />;
    if (term.includes("rain") || term.includes("shower")) return <CloudRain className="w-8 h-8 text-[#06b6d4]" />;
    return <CloudSun className="w-8 h-8 text-slate-300" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full overflow-y-auto pr-4 space-y-6"
    >
      {/* Header and Sector selector */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <CloudSun className="text-emerald-400 w-7 h-7" /> Weather & Microclimate Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time hyper-local soil sensors, dew point trackers, and satellite predictions.
          </p>
        </div>
        
        {/* Sector Selector */}
        <select
          value={activeGeo}
          onChange={(e) => setActiveGeo(e.target.value)}
          className="bg-[#151c28] border border-slate-800 text-slate-250 text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50 cursor-pointer text-slate-200"
        >
          {sectors.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
      </div>

      {/* Grid of microclimate details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Temp */}
        <div className="bg-[#151c28] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 text-slate-450 block text-slate-400">Air Temperature</span>
            <span className="text-2xl font-display font-bold text-white mt-1 block">{weather.temperature}°C</span>
          </div>
        </div>

        {/* Metric 2: Soil Moisture */}
        <div className="bg-[#151c28] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 text-slate-400 block">Soil Moisture (NPK Core)</span>
            <span className="text-2xl font-display font-bold text-emerald-400 mt-1 block">{weather.soilMoisture}%</span>
          </div>
        </div>

        {/* Metric 3: Humidity */}
        <div className="bg-[#151c28] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 text-slate-450 block text-slate-400">Atmospheric Humidity</span>
            <span className="text-2xl font-display font-bold text-slate-200 mt-1 block">{weather.humidity}%</span>
          </div>
        </div>

        {/* Metric 4: Wind */}
        <div className="bg-[#151c28] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-350 border border-slate-500/20 text-slate-300">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 block text-slate-400">Wind Velocity / Angle</span>
            <span className="text-2xl font-display font-bold text-slate-200 mt-1 block">{weather.windSpeed} km/h</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Weekly Forecast spline/bar grid (8 cols) */}
        <div className="lg:col-span-8 bg-[#151c28] border border-slate-800 p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-semibold text-white">7-Day Transpiration Forecast</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            {weather.weeklyForecast.map((day, idx) => (
              <div key={idx} className="bg-[#0f1420]/80 border border-slate-800/80 p-4 rounded-xl text-center space-y-3 hover:scale-[1.01] transition-transform">
                <span className="text-xs font-bold text-slate-400 block font-mono uppercase">{day.day}</span>
                <div className="flex items-center justify-center my-2">
                  {getWeatherIcon(day.condition)}
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">{day.temp}°C</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Hum {day.humidity}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Core evaporation SVG index trend */}
          <div className="p-4 bg-slate-905/30 border border-slate-800/60 rounded-xl relative overflow-hidden bg-[#0d121c]/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-450 uppercase text-slate-400 font-mono">Microclimate Evaporation Curve</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded">Normal Evaporation Index: 2.4mm/day</span>
            </div>
            
            {/* Custom SVG line */}
            <div className="h-28 w-full mt-2 relative">
              <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0,45 Q60,10 120,35 T240,15 T360,20 T400,25" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.8" />
                <path d="M0,45 Q60,10 120,35 T240,15 T360,20 T400,25 L400,60 L0,60 Z" fill="rgba(16,185,129,0.04)" />
                <circle cx="120" cy="35" r="4" fill="#22c55e" />
                <circle cx="240" cy="15" r="4" fill="#22c55e" />
              </svg>
            </div>
          </div>
        </div>

        {/* Rain and Soil Absorption gauge (4 cols) */}
        <div className="lg:col-span-4 bg-[#151c28] border border-slate-800 p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase text-slate-400 font-mono tracking-wider">Hydrological absorption</h3>
            <h4 className="text-sm font-semibold text-white mt-1">Water Runoff & Absorption Coefficient</h4>
          </div>

          <div className="space-y-4 font-sans text-xs">
            {/* Sector absorption coefficient */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Clay Moisture Density</span>
                <span className="font-bold text-white">4.8 cBar</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[62%] rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Dew Point Index</span>
                <span className="font-bold text-white">14.2°C</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 w-[78%] rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Evapotranspiration Level</span>
                <span className="font-bold text-white">Minor stress</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[24%] rounded-full" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#1e2736]/40 rounded-xl flex gap-3.5 border border-slate-800/40">
            <Eye className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-normal">
              <strong>Prediction Mode:</strong> Dew drops of 0.8mm will develop tonight starting at 11:45 PM. Leaf surface moisture will rise to 82%. Highly recommended to avoid nitrogen sprays today.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
