import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Tab } from "../types";
import { Send, Bot, User, Search, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface AiAssistantViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
  groundingSources: { title: string; uri: string }[];
}

export default function AiAssistantView({
  chatHistory,
  onSendMessage,
  isGenerating,
  groundingSources
}: AiAssistantViewProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What are organic treatments for Leaf Rust?",
    "Suggest optimal NPK ratio for Soybean vegetative phase",
    "How does 24°C temperature affect corn water evapotranspiration?",
    "Explain late blight leaf characteristics in tomatoes"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="p-6 flex flex-col h-full overflow-hidden"
    >
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Bot className="text-emerald-400 w-7 h-7" /> EnFarm AI Assistant
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Chat with an elite agronomist and plant pathologist powered by real-time Google Search Grounding.
        </p>
      </div>

      {/* Suggested questions container when chat is empty */}
      {chatHistory.length === 0 && (
        <div className="my-auto max-w-2xl mx-auto space-y-6 px-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">How can I support your crops today?</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a quick query below or write your own custom diagnostic inquiry.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!isGenerating) onSendMessage(q);
                }}
                className="p-3.5 rounded-xl bg-[#151c28]/90 border border-slate-800 hover:border-emerald-500/40 hover:bg-[#1c2637]/80 text-left text-xs text-slate-300 hover:text-white transition-all duration-200 shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Conversation Feed */}
      {chatHistory.length > 0 && (
        <div className="flex-1 bg-[#0d121c]/45 border border-slate-800/40 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4 select-text">
          {chatHistory.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${
                  isUser 
                    ? "bg-slate-800 border-slate-700 text-slate-300" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  isUser 
                    ? "bg-slate-800/90 text-white rounded-tr-none" 
                    : "bg-[#151c28] border border-slate-800/60 text-slate-200 rounded-tl-none leading-relaxed"
                }`}>
                  <p className="text-sm whitespace-pre-wrap selection:bg-emerald-500/25">{message.text}</p>
                  
                  {/* Streaming Indicator */}
                  {message.isStreaming && (
                    <div className="flex gap-1.5 items-center mt-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}

                  <span className="text-[10px] text-slate-550 mt-2 block font-mono text-slate-500 text-right">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          
          {isGenerating && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 bg-[#151c28] border border-slate-800/60 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="text-xs text-slate-400">Consulting agronomist neural network...</span>
              </div>
            </div>
          )}

          {/* Render Grounding sources under the latest model response if available */}
          {!isGenerating && groundingSources.length > 0 && chatHistory[chatHistory.length - 1]?.role === "model" && (
            <div className="mt-2 p-3 bg-slate-900/40 border border-slate-800/40 rounded-xl max-w-[85%] mr-auto ml-12 animate-fade-in">
              <span className="text-xs text-slate-405 font-medium flex items-center gap-1.5 mb-2 text-slate-400">
                <Search className="w-3.5 h-3.5 text-emerald-400" /> Grounded Search References:
              </span>
              <div className="flex flex-wrap gap-2">
                {groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] bg-[#1a2333] hover:bg-emerald-500 hover:text-white text-slate-300 border border-slate-800 hover:border-emerald-400 px-3 py-1 rounded-lg transition-colors duration-200 inline-block truncate max-w-[200px]"
                    title={source.title}
                  >
                    {source.title || "Source Reference"}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form Panel */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about fertilizer ratios, pathogena diagnostics, light absorption cycles..."
          disabled={isGenerating}
          className="flex-1 bg-[#151c28] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold px-5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Inquire</span>
        </button>
      </form>
    </motion.div>
  );
}
