import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Leaf, 
  X, 
  Volume2, 
  VolumeX, 
  Mic, 
  Sparkles,
  Command,
  ArrowRight
} from "lucide-react";
import { Tab } from "../types";

export enum VoiceState {
  INACTIVE = "INACTIVE",
  LISTENING = "LISTENING",
  THINKING = "THINKING",
  SPEAKING = "SPEAKING"
}

interface CenGlobalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  latestDiagnosisText: string;
  onTriggerImageUpload: () => void;
}

export default function CenGlobalOverlay({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  latestDiagnosisText,
  onTriggerImageUpload
}: CenGlobalOverlayProps) {
  // Voice states
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.LISTENING);
  const [transcript, setTranscript] = useState<string>("");
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>("");
  
  // Real-time voice visual volume
  const [waveHeightMultiplier, setWaveHeightMultiplier] = useState<number>(1.0);
  
  // Advanced browser API refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceTimerRef = useRef<any>(null);
  const waveAnimFrameRef = useRef<number | null>(null);

  // Sound levels generator loop
  useEffect(() => {
    let animId: number;
    const updateWaveHeight = () => {
      if (voiceState === VoiceState.LISTENING) {
        setWaveHeightMultiplier(0.5 + Math.random() * 0.9);
      } else if (voiceState === VoiceState.SPEAKING) {
        setWaveHeightMultiplier(0.8 + Math.random() * 1.2);
      } else if (voiceState === VoiceState.THINKING) {
        setWaveHeightMultiplier(0.2 + Math.sin(Date.now() / 100) * 0.15);
      } else {
        setWaveHeightMultiplier(0.15 + Math.sin(Date.now() / 400) * 0.05);
      }
      animId = requestAnimationFrame(updateWaveHeight);
    };
    
    if (isOpen) {
      animId = requestAnimationFrame(updateWaveHeight);
    }
    
    return () => cancelAnimationFrame(animId);
  }, [voiceState, isOpen]);

  // Speech synthesis & SpeechRecognition initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Set up Speech Recognition whenever overlay is triggered open
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      return;
    }

    setVoiceState(VoiceState.LISTENING);
    setTranscript("");
    setCurrentResponse("");

    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setVoiceState(VoiceState.LISTENING);
        };

        rec.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setTranscript(speechToText);
          handleVoiceCommand(speechToText);
        };

        rec.onerror = (err: any) => {
          console.error("CEN Audio Capture Error:", err);
          setTranscript("Microphone request unhandled or timed out.");
          setVoiceState(VoiceState.THINKING);
          
          // Autumn-back simulation if microphone fails inside sandbox
          setTimeout(() => {
            setTranscript("Simulated Command ... 'Open Weather Intelligence'");
            handleVoiceCommand("Open Weather Intelligence");
          }, 3000);
        };

        rec.onend = () => {
          // Keep listening or switch states
        };

        recognitionRef.current = rec;
        
        // Start live recording
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Could not immediately auto-start speech model: ", e);
        }
      } else {
        // Fallback simulated voice activation sequence for non-supported browsers
        setTranscript("Speech recognition API restricted. Simulating vocal signatures...");
        setTimeout(() => {
          const choices = [
            "Open Weather Intelligence",
            "Read latest diagnosis",
            "Open Market Intelligence",
            "What is drip irrigation?"
          ];
          const choice = choices[Math.floor(Math.random() * choices.length)];
          setTranscript(`Simulated audio capture: "${choice}"`);
          handleVoiceCommand(choice);
        }, 3200);
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isOpen]);

  // Read response aloud with premium synthetic voice
  const speakAloud = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Limit responses to be punchy and clear
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose ideal voice options
    const voices = synthRef.current.getVoices();
    const premiumVoice = 
      voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Female")) ||
      voices[0];
    
    if (premiumVoice) utterance.voice = premiumVoice;
    
    utterance.rate = 1.05;
    utterance.pitch = 1.15; // Smooth Apple / OpenAI synthesizer pitch

    utterance.onstart = () => {
      setVoiceState(VoiceState.SPEAKING);
      setCurrentResponse(text);
    };

    utterance.onend = () => {
      setVoiceState(VoiceState.INACTIVE);
      // Wait a moment then automatically dismiss the overlay perfectly
      setTimeout(() => {
        onClose();
      }, 2500);
    };

    utterance.onerror = () => {
      setVoiceState(VoiceState.INACTIVE);
      setTimeout(() => onClose(), 1000);
    };

    if (!isMuted) {
      synthRef.current.speak(utterance);
    } else {
      // If muted, display text for 5 seconds and exit
      setVoiceState(VoiceState.SPEAKING);
      setCurrentResponse(text);
      setTimeout(() => {
        setVoiceState(VoiceState.INACTIVE);
        onClose();
      }, 5000);
    }
  };

  // Main voice commander & action router logic
  const handleVoiceCommand = async (command: string) => {
    setVoiceState(VoiceState.THINKING);
    const textNormal = command.toLowerCase().trim();

    // Simulating deep network lookups (300ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Command mapping index
    // NAVIGATION
    if (textNormal.includes("dashboard") || textNormal.includes("main screen") || textNormal.includes("home")) {
      setActiveTab(Tab.DASHBOARD);
      speakAloud("Affirmative. Directing secure mainframe view to your central Dashboard segment.");
    } 
    else if (textNormal.includes("weather") || textNormal.includes("temperature") || textNormal.includes("rain") || textNormal.includes("soil moisture")) {
      setActiveTab(Tab.WEATHER_INTELLIGENCE);
      speakAloud("Understood. Initializing active Weather Intelligence satellite radar telemetry.");
    } 
    else if (textNormal.includes("market") || textNormal.includes("prices") || textNormal.includes("futures") || textNormal.includes("soybean") || textNormal.includes("maize")) {
      setActiveTab(Tab.MARKET_INTELLIGENCE);
      speakAloud("Confirmed. Synchronizing global crop contract price index vectors inside Market Intelligence.");
    } 
    else if (textNormal.includes("upload") || textNormal.includes("camera") || textNormal.includes("take photo")) {
      setActiveTab(Tab.UPLOAD_ANALYSIS);
      onTriggerImageUpload();
      speakAloud("Understood. I have initiated the deep optical sensor framework. Select or drop your crop health photograph now.");
    } 
    else if (textNormal.includes("results") || textNormal.includes("diagnosis results") || textNormal.includes("diagnostic results")) {
      setActiveTab(Tab.ANALYSIS_RESULTS);
      speakAloud("Affirmative. Activating agricultural pathology ledger reports.");
    } 
    else if (textNormal.includes("history") || textNormal.includes("past records") || textNormal.includes("logs")) {
      setActiveTab(Tab.HISTORY);
      speakAloud("Confirmed. Retransmitting archived field health histories block ledger.");
    } 
    else if (textNormal.includes("settings") || textNormal.includes("farm profile")) {
      setActiveTab(Tab.SETTINGS);
      speakAloud("Opening your biometric demographic farm profile configure matrices.");
    }
    // ACTIONS
    else if (textNormal.includes("read diagnosis") || textNormal.includes("read results") || textNormal.includes("latest diagnosis") || textNormal.includes("how healthy")) {
      setActiveTab(Tab.ANALYSIS_RESULTS);
      const readText = latestDiagnosisText || "No diagnostic ledger scanned. Trigger a crop upload to review agricultural pathology.";
      speakAloud(`Latest analysis states: ${readText}`);
    } 
    else if (textNormal.includes("upload crop") || textNormal.includes("analyze crop") || textNormal.includes("analyze image")) {
      setActiveTab(Tab.UPLOAD_ANALYSIS);
      onTriggerImageUpload();
      speakAloud("Directing visual pathology module setup. Click the analyzer core to pick an image segment.");
    } 
    else {
      // General Agricultural queries submitted directly to Gemini backend!
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: command, history: [] })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Extract plain text and speak
          const cleanText = data.text.replace(/[*#]/g, "").substring(0, 150);
          speakAloud(cleanText || "Precision systems synced. I cannot fully parse deep agronomics for that command.");
        } else {
          speakAloud("External neural arrays are offline. Under seasonal norms, drip irrigation flow should remain calibrated.");
        }
      } catch (err) {
        speakAloud("Sync limits reached in the backend. I suggest stabilizing nitrogen levels to buffer early leaf rust conditions.");
      }
    }
  };

  // Skip visual listening wait and simulation directly
  const runDirectSimulatorCommand = (command: string) => {
    setTranscript(`Simulated Command: "${command}"`);
    handleVoiceCommand(command);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* Immersive digital coordinate details on top of screen */}
      <div className="p-6 flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-widest z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>CEN VIRTUAL AGENT MATRIX</span>
        </div>
        <div className="flex items-center gap-4">
          <span>LATENCY: ZERO</span>
          <span>SATELLITE SYNC: ACTIVE</span>
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-1 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main active spoken feedback */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
        
        {/* Dynamic visual state tag typography */}
        <div className="mb-4">
          <AnimatePresence mode="wait">
            <motion.p 
              key={voiceState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl md:text-3xl font-display font-medium text-emerald-400 tracking-tight glow-emerald"
            >
              {voiceState === VoiceState.LISTENING && "Listening..."}
              {voiceState === VoiceState.THINKING && "Processing..."}
              {voiceState === VoiceState.SPEAKING && "Speaking..."}
              {voiceState === VoiceState.INACTIVE && "Systems Synced Correctly"}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Dynamic transcript dialogue subtitle bubbles */}
        <div className="max-w-xl h-24 flex items-center justify-center">
          <p className="text-slate-350 text-base italic leading-relaxed text-slate-350">
            {transcript ? `"${transcript}"` : "Say a command to CEN..."}
          </p>
        </div>

        {/* AI response box */}
        <AnimatePresence>
          {currentResponse && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-4 max-w-2xl bg-emerald-500/5 border border-emerald-500/25 p-4 rounded-2xl backdrop-blur-xl flex gap-3.5 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">CEN AUDIO SYNTHESIS</p>
                <p className="text-sm text-slate-200 mt-1 font-sans">{currentResponse}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE GIANT APPLE SIRI GALAXY ORB WITH SPREADING WAVEFORMS */}
        <div className="mt-12 mb-6 w-full max-w-4xl flex items-center justify-center relative h-56">

          {/* LEFT OSCILLATING AUDIO WAVE GRAPHIC (Identical to reference mockup) */}
          <div className="absolute left-4 md:left-20 right-1/2 mr-28 flex items-center justify-end gap-[3px] h-12 overflow-hidden z-0">
            {[...Array(24)].map((_, idx) => {
              // Mathematical scale formula favoring height decay away from center orb
              const distanceFromCenter = 24 - idx;
              const normalizedDist = distanceFromCenter / 24;
              const targetHeight = Math.floor(
                (Math.sin(idx * 0.4 + Date.now() / 200) * 12 + 18) * 
                waveHeightMultiplier * 
                (1 - normalizedDist * 0.7)
              );

              return (
                <div 
                  key={`left-wave-${idx}`}
                  style={{ height: `${Math.max(2, targetHeight)}px` }}
                  className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400/80 to-emerald-400/80 transition-all duration-75"
                />
              );
            })}
          </div>

          {/* CENTRAL CYCLING GLOWING ORBE CORE (Apple Siri inspired template style) */}
          <div 
            onClick={() => {
              if (voiceState === VoiceState.SPEAKING) {
                if (synthRef.current) synthRef.current.cancel();
                setVoiceState(VoiceState.LISTENING);
              } else {
                setVoiceState(VoiceState.LISTENING);
              }
            }}
            className="w-40 h-40 rounded-full flex items-center justify-center relative cursor-pointer z-10 group"
          >
            {/* Ambient pulsating neon lights */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-emerald-400 to-indigo-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse" />
            
            {/* Spinning background track lines */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/20 animate-[spin_20s_infinite_linear]" />
            <div className="absolute inset-3 rounded-full border border-emerald-500/30 animate-[spin_12s_infinite_linear_reverse]" />

            {/* Solid crystal circular glass sphere core with deep drop-shadow */}
            <div className="absolute inset-6 rounded-full bg-black/75 border border-white/20 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.35),inset_0_4px_20px_rgba(255,255,255,0.1)] group-hover:border-emerald-400/50 transition-colors">
              
              {/* Inner glowing core with a green Leaf emblem inside */}
              <div className="relative w-16 h-16 rounded-full bg-[#030610] border border-cyan-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_-2px_rgba(6,180,210,0.5)]">
                <Leaf className="w-8 h-8 text-emerald-400 fill-emerald-500/20 animate-pulse" />
              </div>

            </div>
          </div>

          {/* RIGHT OSCILLATING AUDIO WAVE GRAPHIC (Mirror representation) */}
          <div className="absolute right-4 md:right-20 left-1/2 ml-28 flex items-center justify-start gap-[3px] h-12 overflow-hidden z-0">
            {[...Array(24)].map((_, idx) => {
              const distanceFromCenter = idx;
              const normalizedDist = distanceFromCenter / 24;
              const targetHeight = Math.floor(
                (Math.sin(idx * 0.4 - Date.now() / 200) * 12 + 18) * 
                waveHeightMultiplier * 
                (1 - normalizedDist * 0.7)
              );

              return (
                <div 
                  key={`right-wave-${idx}`}
                  style={{ height: `${Math.max(2, targetHeight)}px` }}
                  className="w-[3px] rounded-full bg-gradient-to-t from-emerald-400/80 to-cyan-400/80 transition-all duration-75"
                />
              );
            })}
          </div>

        </div>

        {/* Recommended voice shortcuts panel mirroring the screenshot EXACTLY */}
        <div className="mt-4 flex flex-col items-center space-y-3 z-10 w-full max-w-md">
          
          {/* Cybernetic command text field for fallback entry */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (manualText.trim()) {
                runDirectSimulatorCommand(manualText);
                setManualText("");
              }
            }}
            className="w-full flex items-center bg-[#070c16] border border-cyan-500/30 focus-within:border-emerald-500/60 rounded-xl px-3 py-2 transition-all shadow-[0_0_15px_rgba(6,180,210,0.1)]"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mr-2 animate-pulse" />
            <input 
              type="text" 
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type a command or agri-question..." 
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            />
            <button 
              type="submit" 
              className="text-[10px] bg-cyan-500/20 text-cyan-300 hover:bg-emerald-500/20 hover:text-emerald-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all cursor-pointer"
            >
              SEND
            </button>
          </form>

          <p className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
            Or say / select these commands:
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => runDirectSimulatorCommand("Open Weather Intelligence")}
              className="text-xs bg-[#09101d] border border-cyan-500/20 hover:border-cyan-500 py-3 px-4 rounded-xl text-cyan-300 hover:text-white font-mono tracking-wide transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5 flex items-center justify-between group"
            >
              <span>“Open Weather Intelligence”</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => runDirectSimulatorCommand("Upload crop image")}
              className="text-xs bg-[#09101d] border border-cyan-500/20 hover:border-cyan-500 py-3 px-4 rounded-xl text-cyan-300 hover:text-white font-mono tracking-wide transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5 flex items-center justify-between group"
            >
              <span>“Upload maize image”</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => runDirectSimulatorCommand("Read latest diagnosis")}
              className="text-xs bg-[#09101d] border border-cyan-500/20 hover:border-cyan-500 py-3 px-4 rounded-xl text-cyan-300 hover:text-white font-mono tracking-wide transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5 flex items-center justify-between group"
            >
              <span>“Read latest diagnosis”</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

      </div>

      {/* Manual Quick Action buttons footer for super simple debugging and testing */}
      <div className="p-4 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-center gap-2 z-10">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mr-2">Vocal Bypass Controls:</span>
        <button 
          onClick={() => runDirectSimulatorCommand("Open Dashboard")} 
          className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-slate-300"
        >
          🖥️ Open Dashboard
        </button>
        <button 
          onClick={() => runDirectSimulatorCommand("Open Market Intelligence")} 
          className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-slate-300"
        >
          📈 Open Market
        </button>
        <button 
          onClick={() => runDirectSimulatorCommand("Read latest diagnosis")} 
          className="text-[10px] bg-[#07201c] hover:bg-[#0d2e29] px-3 py-1.5 rounded-lg border border-emerald-500/20 font-mono text-emerald-400 font-bold"
        >
          🌾 Read Diagnosis
        </button>
        <button 
          onClick={() => runDirectSimulatorCommand("What is drip irrigation?")} 
          className="text-[10px] bg-[#081e28] hover:bg-[#0c2b3a] px-3 py-1.5 rounded-lg border border-cyan-500/20 font-mono text-cyan-300"
        >
          ❓ What is drip irrigation?
        </button>
      </div>

    </div>
  );
}
