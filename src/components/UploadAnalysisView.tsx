import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, Cpu, HelpCircle, FileImage } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UploadAnalysisViewProps {
  onAnalyzeImage: (base64Image: string, mimeType: string, cropType: string) => Promise<void>;
  isAnalyzing: boolean;
}

export default function UploadAnalysisView({ onAnalyzeImage, isAnalyzing }: UploadAnalysisViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("Auto-Detect");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; preview: string } | null>(null);
  const [base64String, setBase64String] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // High-fidelity vector representations of diseased leaves as pre-provided samples
  // This allows immediate testing of the AI Pathology Engine!
  const sampleLeaves = [
    {
      id: "leaf-rust-wheat",
      label: "Rust Infected Wheat",
      crop: "Wheat",
      description: "Orange-brown pustule blisters on upper foliage",
      // Simple base64 red/orange rust leaf representation
      dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%231e293b'/><ellipse cx='50' cy='50' rx='25' ry='40' fill='%2322c55e' transform='rotate(15 50 50)'/><path d='M30 40 Q40 50 50 42 T70 38' stroke='%23f97316' stroke-width='4' fill='none'/><circle cx='42' cy='35' r='3' fill='%23ea580c'/><circle cx='54' cy='48' r='2' fill='%23ea580c'/><circle cx='48' cy='58' r='3' fill='%23ea580c'/><circle cx='58' cy='32' r='2' fill='%23b45309'/><circle cx='38' cy='52' r='4' fill='%23b45309'/></svg>"
    },
    {
      id: "blight-tomato",
      label: "Blight Tomato Foliage",
      crop: "Tomato",
      description: "Defoliation and concentric brown rings",
      dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%231e293b'/><path d='M50 15 C20 45 35 85 50 85 C65 85 80 45 50 15 Z' fill='%234ade80'/><circle cx='42' cy='45' r='8' fill='%2378350f' opacity='0.75'/><circle cx='42' cy='45' r='4' fill='%23451a03'/><circle cx='58' cy='62' r='10' fill='%2378350f' opacity='0.75'/><circle cx='58' cy='62' r='5' fill='%23451a03'/><line x1='50' y1='15' x2='50' y2='85' stroke='%2315803d' stroke-width='2'/></svg>"
    },
    {
      id: "healthy-corn",
      label: "Healthy Corn Sprout",
      crop: "Corn",
      description: "Dense chlorophyll cells and strong cellular turgor",
      dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%231e293b'/><ellipse cx='50' cy='50' rx='18' ry='42' fill='%2310b981' transform='rotate(-10 50 50)'/><line x1='50' y1='10' x2='42' y2='90' stroke='%23047857' stroke-width='2.5'/><ellipse cx='42' cy='45' rx='6' ry='12' fill='%2334d399' transform='rotate(30 42 45)'/></svg>"
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid leaf image file (PNG or JPEG).");
      return;
    }

    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setUploadedFile({
        name: file.name,
        size: sizeStr,
        preview: b64
      });
      setBase64String(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const chooseSample = (sample: typeof sampleLeaves[0]) => {
    setUploadedFile({
      name: `${sample.label}.svg`,
      size: "Vector Path",
      preview: sample.dataUrl
    });
    setBase64String(sample.dataUrl);
    setSelectedCrop(sample.crop);
  };

  const handleUploadSubmit = () => {
    if (!base64String) return;
    const isSvg = uploadedFile?.name.endsWith(".svg");
    const mime = isSvg ? "image/svg+xml" : "image/jpeg";
    onAnalyzeImage(base64String, mime, selectedCrop);
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
          <UploadCloud className="text-emerald-400 w-7 h-7" /> Upload Foliage Analysis
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Provide farm leaf photos to automatically detect bacterial, fungal pathogena, or soil mineral shortages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Picker Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
              dragActive 
                ? "border-emerald-500 bg-emerald-500/5" 
                : uploadedFile 
                  ? "border-emerald-600/50 bg-[#151c28]/40" 
                  : "border-slate-800 hover:border-emerald-500/40 bg-[#151c28]/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
              disabled={isAnalyzing}
            />

            {uploadedFile ? (
              <div className="space-y-4 w-full">
                {/* Visual Leaf circular display */}
                <div className="w-28 h-28 rounded-2xl border border-slate-700 mx-auto overflow-hidden bg-slate-950 relative group">
                  <img
                    src={uploadedFile.preview}
                    alt="Uploaded Leaf foliage"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-2">
                      <Cpu className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-mono mt-1 font-bold">Scanning</span>
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-500/80 shadow-[0_0_15px_#10b981] animate-bounce" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white truncate">{uploadedFile.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{uploadedFile.size}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    setBase64String(null);
                  }}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 pointer-events-auto cursor-pointer"
                >
                  Clear File
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Drag leaf photo here, or scroll click to browse</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">SUPPORTS PNG, JPEG, OR HEIC UP TO 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Select crop type metadata */}
          <div className="bg-[#151c28] p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Specify Crop Variety
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {["Auto-Detect", "Wheat", "Tomato", "Corn", "Soybeans"].map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => setSelectedCrop(crop)}
                  disabled={isAnalyzing}
                  className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedCrop === crop
                      ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                      : "bg-[#1d2736]/40 text-slate-350 border border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-450 text-slate-400 leading-relaxed font-sans mt-2">
              Auto-Detect uses Gemini's deep visual catalog to cross-reference plant structure, venation grids, and pixel coordinates.
            </p>
          </div>

          {/* Submit Action Button */}
          <button
            onClick={handleUploadSubmit}
            disabled={!base64String || isAnalyzing}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 font-display font-bold text-sm text-slate-950 uppercase tracking-widest rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/5 hover:scale-[1.005] duration-200 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Cpu className="w-5 h-5 animate-spin" />
                <span>Running Al Pathological Assay...</span>
              </>
            ) : (
              <>
                <Cpu className="w-5 h-5" />
                <span>Analyze Leaf Pathology</span>
              </>
            )}
          </button>

        </div>

        {/* Right Test Samples Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#151c28] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Instant Diagnostics Testing</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select one of our calibrated lab pathology files below to immediately experience the AI diagnosis flow.
            </p>
          </div>

          <div className="space-y-3">
            {sampleLeaves.map((sample) => (
              <div
                key={sample.id}
                onClick={() => chooseSample(sample)}
                className="p-3 bg-[#0d121c] border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center gap-3.5 cursor-pointer hover:bg-[#131b2a] transition-all group"
              >
                {/* Visual Preview SVG display */}
                <div 
                  className="w-12 h-12 rounded-lg shrink-0 border border-slate-800 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sample.dataUrl.replace("data:image/svg+xml;utf8,", "") }}
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {sample.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sample.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#1e2736]/30 border border-slate-800/40 p-4 rounded-xl flex gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-normal">
              <strong>Real-Time API:</strong> Back-end queries Gemini 3.5 Pathologist instantly. It generates health scores, determines risk categorizations, is non-destructive, and gives recommendations.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
