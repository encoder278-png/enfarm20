import React, { useState } from "react";
import { FarmerProfile } from "../types";
import { MessageCircle, Send, Phone, MapPin, Leaf, Users } from "lucide-react";
import { motion } from "motion/react";

interface WhatsAppChatViewProps {
  farmers: FarmerProfile[];
  selectedFarmer: FarmerProfile | null;
  onSelectFarmer: (farmer: FarmerProfile) => void;
}

export default function WhatsAppChatView({ farmers, selectedFarmer, onSelectFarmer }: WhatsAppChatViewProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<{ text: string; timestamp: string }[]>([]);

  const formatPhone = (id: string) =>
    id.replace("wa_", "+").replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");

  const formatTime = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("sw-TZ", { day: "numeric", month: "short" });
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedFarmer || sending) return;
    setSending(true);

    try {
      const response = await fetch("/api/whatsapp-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedFarmer.farmerId.replace("wa_", "+"),
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setSentMessages((prev) => [
          ...prev,
          { text: message.trim(), timestamp: new Date().toISOString() },
        ]);
        setMessage("");
      }
    } catch {
      alert("Imeshindwa kutuma ujumbe. Jaribu tena.");
    } finally {
      setSending(false);
    }
  };

  const allConversations = selectedFarmer
    ? [
        ...(selectedFarmer.conversations || []).map((c) => ({
          role: c.role,
          text: c.text,
          timestamp: c.timestamp,
        })),
        ...sentMessages.map((m) => ({
          role: "admin" as const,
          text: m.text,
          timestamp: m.timestamp,
        })),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="h-full flex overflow-hidden"
    >
      {/* Left — Farmers list */}
      <div className="w-72 border-r border-slate-800/50 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-800/50">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            WhatsApp Chat
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mazungumzo {farmers.length}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {farmers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 p-6">
              <Users className="w-10 h-10 opacity-20" />
              <p className="text-xs text-center">
                Hakuna wakulima bado. Subiri wakulima watume ujumbe WhatsApp.
              </p>
            </div>
          ) : (
            farmers.map((farmer) => {
              const lastMsg = (farmer.conversations || []).slice(-1)[0];
              const isSelected = selectedFarmer?.farmerId === farmer.farmerId;
              return (
                <div
                  key={farmer.farmerId}
                  onClick={() => onSelectFarmer(farmer)}
                  className={`px-4 py-3 border-b border-slate-800/30 cursor-pointer transition-all hover:bg-[#111827]/60 ${
                    isSelected ? "bg-[#1d2736]/80 border-l-2 border-l-emerald-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0">
                      {(farmer.name || farmer.farmerId.replace("wa_", ""))[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">
                          {farmer.name || formatPhone(farmer.farmerId)}
                        </p>
                        {lastMsg && (
                          <span className="text-xs text-slate-500 shrink-0 ml-1">
                            {formatDate(lastMsg.timestamp)}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {lastMsg.role === "farmer" ? "" : "CEN: "}
                          {lastMsg.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right — Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFarmer ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-slate-800/50 shrink-0 bg-[#0d131f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base font-bold">
                  {(selectedFarmer.name || selectedFarmer.farmerId.replace("wa_", ""))[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {selectedFarmer.name || formatPhone(selectedFarmer.farmerId)}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />
                      {formatPhone(selectedFarmer.farmerId)}
                    </span>
                    {selectedFarmer.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {selectedFarmer.location}
                      </span>
                    )}
                    {(selectedFarmer.crops || []).length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Leaf className="w-3 h-3" />
                        {selectedFarmer.crops.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {allConversations.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Hakuna mazungumzo bado.
                </div>
              ) : (
                allConversations.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "farmer" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === "farmer"
                          ? "bg-[#1d2736] text-slate-200 rounded-bl-none"
                          : msg.role === "admin"
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-br-none"
                          : "bg-emerald-500/20 border border-emerald-500/20 text-emerald-100 rounded-br-none"
                      }`}
                    >
                      {msg.role === "cen" && (
                        <p className="text-xs text-emerald-400 font-semibold mb-1">CEN</p>
                      )}
                      {msg.role === "admin" && (
                        <p className="text-xs text-blue-400 font-semibold mb-1">Wewe</p>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className="text-xs opacity-50 mt-1 text-right">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message input */}
            <div className="px-5 py-4 border-t border-slate-800/50 shrink-0 bg-[#0d131f]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Andika ujumbe kwa mkulima..."
                  className="flex-1 bg-[#151c28] border border-slate-700/60 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Ujumbe huu utatumwa moja kwa moja kwa mkulima kupitia WhatsApp
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <MessageCircle className="w-16 h-16 opacity-10" />
            <p className="text-sm">Chagua mkulima kuanza mazungumzo</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}