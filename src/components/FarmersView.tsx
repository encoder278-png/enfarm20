import React, { useState } from "react";
import { FarmerProfile } from "../types";
import { Users, Phone, MapPin, Leaf, Clock, ChevronRight, MessageCircle, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface FarmersViewProps {
  farmers: FarmerProfile[];
  onOpenChat: (farmer: FarmerProfile) => void;
}

export default function FarmersView({ farmers, onOpenChat }: FarmersViewProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FarmerProfile | null>(null);

  const filtered = farmers.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.farmerId.toLowerCase().includes(q) ||
      (f.name || "").toLowerCase().includes(q) ||
      (f.location || "").toLowerCase().includes(q) ||
      (f.crops || []).some((c) => c.toLowerCase().includes(q))
    );
  });

  const formatPhone = (id: string) =>
    id.replace("wa_", "+").replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");

  const formatDate = (iso: string) => {
    if (!iso) return "Haijulikani";
    const d = new Date(iso);
    return d.toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" });
  };

  const getSeverityColor = (diseases: FarmerProfile["diseases"]) => {
    if (!diseases || diseases.length === 0) return null;
    const last = diseases[diseases.length - 1];
    if (last.severity === "Severe") return "text-rose-400";
    if (last.severity === "Moderate") return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Wakulima
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Wakulima {farmers.length} wanaotumia CEN WhatsApp
            </p>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Tafuta mkulima..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#151c28] border border-slate-700/60 rounded-xl py-2 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-64"
          />
        </div>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-[#151c28] border border-slate-800/60 rounded-xl p-3">
            <p className="text-xs text-slate-500">Jumla ya Wakulima</p>
            <p className="text-2xl font-bold text-white mt-1">{farmers.length}</p>
          </div>
          <div className="bg-[#151c28] border border-slate-800/60 rounded-xl p-3">
            <p className="text-xs text-slate-500">Wanaotumia Leo</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {farmers.filter((f) => {
                if (!f.lastActive) return false;
                const today = new Date().toISOString().split("T")[0];
                return f.lastActive.startsWith(today);
              }).length}
            </p>
          </div>
          <div className="bg-[#151c28] border border-slate-800/60 rounded-xl p-3">
            <p className="text-xs text-slate-500">Magonjwa Makubwa</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">
              {farmers.filter((f) =>
                (f.diseases || []).some((d) => d.severity === "Severe")
              ).length}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Farmers list */}
        <div className="w-full lg:w-1/2 border-r border-slate-800/50 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm">
                {farmers.length === 0
                  ? "Hakuna wakulima bado. Subiri wakulima watume ujumbe WhatsApp."
                  : "Hakuna matokeo ya utafutaji."}
              </p>
            </div>
          ) : (
            filtered.map((farmer) => (
              <div
                key={farmer.farmerId}
                onClick={() => setSelected(farmer)}
                className={`px-5 py-4 border-b border-slate-800/40 cursor-pointer transition-all hover:bg-[#111827]/60 ${
                  selected?.farmerId === farmer.farmerId ? "bg-[#1d2736]/80 border-l-2 border-l-emerald-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0">
                    {(farmer.name || farmer.farmerId.replace("wa_", ""))[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">
                        {farmer.name || formatPhone(farmer.farmerId)}
                      </p>
                      <span className="text-xs text-slate-500 shrink-0 ml-2">
                        {formatDate(farmer.lastActive)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {farmer.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {farmer.location}
                        </span>
                      )}
                      {(farmer.crops || []).length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Leaf className="w-3 h-3 text-emerald-400" />
                          {farmer.crops.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        Ujumbe {(farmer.conversations || []).length}
                      </span>
                      {(farmer.diseases || []).length > 0 && (
                        <span className={`flex items-center gap-1 text-xs ${getSeverityColor(farmer.diseases)}`}>
                          <AlertTriangle className="w-3 h-3" />
                          Ugonjwa {farmer.diseases.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-3" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Farmer detail panel */}
        <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-5 py-4 border-b border-slate-800/50 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold">
                      {(selected.name || selected.farmerId.replace("wa_", ""))[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        {selected.name || formatPhone(selected.farmerId)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selected.location || "Mahali haijulikani"} · Mwisho {formatDate(selected.lastActive)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenChat(selected)}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm hover:bg-emerald-500/20 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Fungua Chat
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Crops */}
                {(selected.crops || []).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Mazao</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.crops.map((c, i) => (
                        <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disease history */}
                {(selected.diseases || []).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Historia ya Magonjwa</p>
                    <div className="space-y-2">
                      {selected.diseases.map((d, i) => (
                        <div key={i} className="bg-[#151c28] border border-slate-800/60 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{d.diagnosis}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              d.severity === "Severe" ? "bg-rose-500/20 text-rose-400" :
                              d.severity === "Moderate" ? "bg-amber-500/20 text-amber-400" :
                              "bg-emerald-500/20 text-emerald-400"
                            }`}>
                              {d.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{d.crop} · {d.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent conversations */}
                {(selected.conversations || []).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Mazungumzo ya Hivi Karibuni</p>
                    <div className="space-y-2">
                      {selected.conversations.slice(-6).map((c, i) => (
                        <div key={i} className={`flex ${c.role === "farmer" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-xl text-xs ${
                            c.role === "farmer"
                              ? "bg-emerald-500/20 text-emerald-100 rounded-br-none"
                              : "bg-[#1d2736] text-slate-300 rounded-bl-none"
                          }`}>
                            {c.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm">Chagua mkulima kuona maelezo</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}