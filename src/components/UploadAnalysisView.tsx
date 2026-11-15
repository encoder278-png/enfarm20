
import React, { useRef, useState } from "react";
import {
  UploadCloud,
  ImagePlus,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Leaf,
  X,
  Radio,
  Clock3,
  FileImage,
} from "lucide-react";
import { motion } from "motion/react";

interface UploadAnalysisViewProps {
  onAnalyzeImage: (
    base64Image: string,
    mimeType: string,
    cropType: string
  ) => Promise<void>;
  isAnalyzing: boolean;
}

const cropOptions = [
  "Auto-Detect",
  "Mahindi",
  "Muhogo",
  "Mpunga",
  "Alizeti",
  "Maharage",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function UploadAnalysisView({
  onAnalyzeImage,
  isAnalyzing,
}: UploadAnalysisViewProps) {
  const [selectedCrop, setSelectedCrop] = useState("Auto-Detect");

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    preview: string;
    mimeType: string;
  } | null>(null);

  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file?: File) => {
    if (!file) return;

    setError("");

    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to read this image. Please try another file.");
        return;
      }

      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        preview: reader.result,
        mimeType: file.type,
      });
    };

    reader.onerror = () => {
      setError("There was a problem reading the image.");
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    processFile(event.target.files?.[0]);

    // Allows selecting the same image again.
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    if (!isAnalyzing) {
      processFile(event.dataTransfer.files?.[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || isAnalyzing) return;

    setError("");

    try {
      await onAnalyzeImage(
        uploadedFile.preview,
        uploadedFile.mimeType,
        selectedCrop
      );
    } catch {
      setError("Image analysis failed. Please try again.");
    }
  };

  const clearImage = () => {
    if (isAnalyzing) return;

    setUploadedFile(null);
    setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto bg-[#F4F5F0] p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page heading */}
        <header>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#557C62]">
            FIELD INTELLIGENCE
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#183D32] sm:text-3xl">
            Crop Image Analysis
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718076]">
            Upload crop photographs to CEN AI for analysis.
            Review potential crop diseases, pest problems and
            recommended agricultural actions.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">

          {/* Image analysis panel */}
          <section className="space-y-5 xl:col-span-2">

            <div className="rounded-2xl border border-[#E1E7DF] bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF4EC] text-[#315C47]">
                  <Leaf className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-[#183D32]">
                    Submit a crop image
                  </h2>

                  <p className="mt-1 text-xs text-[#829287]">
                    Upload an image from your computer
                  </p>
                </div>
              </div>

              {/* File input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />

              {/* Image preview */}
              {uploadedFile ? (
                <div className="space-y-4">

                  <div className="relative overflow-hidden rounded-xl border border-[#E1E7DF] bg-[#F6F8F3]">
                    <img
                      src={uploadedFile.preview}
                      alt="Selected crop for analysis"
                      className="max-h-[380px] w-full object-contain"
                    />

                    {isAnalyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#183D32]/75 text-white">
                        <Cpu className="h-8 w-8 animate-spin" />

                        <p className="mt-3 text-sm font-semibold">
                          CEN AI is analyzing your image
                        </p>

                        <p className="mt-1 text-xs text-white/75">
                          Please wait for the result
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF4EC] text-[#477C62]">
                        <CheckCircle className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#354B3D]">
                          {uploadedFile.name}
                        </p>

                        <p className="text-xs text-[#829287]">
                          {uploadedFile.size} · {uploadedFile.mimeType}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearImage}
                      disabled={isAnalyzing}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#A34B43] hover:bg-[#FFF3F1] disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Remove image
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!isAnalyzing) setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
                    dragActive
                      ? "border-[#477C62] bg-[#EDF4EC]"
                      : "border-[#DCE4DA] bg-[#FAFBF8]"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4EC] text-[#477C62]">
                    <ImagePlus className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold text-[#354B3D]">
                    Upload a crop photograph
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#829287]">
                    Select a crop image stored on your computer
                    or drag and drop an image into this area.
                  </p>

                  <p className="mt-3 text-xs text-[#9AA79D]">
                    JPEG, PNG or WebP · Maximum 10 MB
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#183D32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#285541] disabled:opacity-50"
                  >
                    <UploadCloud className="h-5 w-5" />
                    Browse images
                  </button>
                </div>
              )}

              {/* Change image action */}
              {uploadedFile && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4DA] bg-white px-4 py-3 text-sm font-semibold text-[#315C47] transition-colors hover:bg-[#F6F8F3] disabled:opacity-50"
                >
                  <FileImage className="h-4 w-4" />
                  Choose another image
                </button>
              )}

              {/* Crop selection */}
              <div className="mt-6 border-t border-[#E8ECE5] pt-5">
                <label className="text-sm font-semibold text-[#354B3D]">
                  Crop type
                </label>

                <p className="mt-1 text-xs text-[#829287]">
                  Select the crop or allow CEN AI to attempt identification.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {cropOptions.map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => setSelectedCrop(crop)}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        selectedCrop === crop
                          ? "border-[#315C47] bg-[#183D32] text-white"
                          : "border-[#DCE4DA] bg-white text-[#52665A] hover:bg-[#F0F5EE]"
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Analysis button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!uploadedFile || isAnalyzing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#477C62] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#315C47] disabled:cursor-not-allowed disabled:bg-[#DCE4DA] disabled:text-[#829287]"
              >
                {isAnalyzing ? (
                  <>
                    <Cpu className="h-5 w-5 animate-spin" />
                    Analyzing image...
                  </>
                ) : (
                  <>
                    <Cpu className="h-5 w-5" />
                    Analyze crop image
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-[#829287]">
                AI results are assessments based on the submitted image.
                Confirm uncertain diagnoses with reliable agricultural advice.
              </p>
            </div>
          </section>

          {/* Rover and workflow panel */}
          <aside className="space-y-5">

            {/* Rover status */}
            <div className="rounded-2xl border border-[#E1E7DF] bg-white p-5 shadow-sm">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F2ED] text-[#829287]">
                  <Radio className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-[#183D32]">
                    Rover camera
                  </h2>

                  <p className="mt-1 text-xs text-[#829287]">
                    Field monitoring
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-[#DCE4DA] bg-[#FAFBF8] p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F2ED] text-[#829287]">
                  <Radio className="h-6 w-6" />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#354B3D]">
                  Rover integration pending
                </p>

                <p className="mt-2 text-xs leading-5 text-[#829287]">
                  Live field camera monitoring will become available
                  after the rover hardware and communication system
                  are integrated.
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  Not yet integrated
                </span>
              </div>
            </div>

            {/* Analysis workflow */}
            <div className="rounded-2xl border border-[#E1E7DF] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#183D32]">
                How crop analysis works
              </h2>

              <div className="mt-4 space-y-4">

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDF4EC] text-xs font-bold text-[#315C47]">
                    1
                  </span>

                  <div>
                    <p className="text-sm font-medium text-[#354B3D]">
                      Select a crop image
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#829287]">
                      Upload an available photograph of the affected crop.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDF4EC] text-xs font-bold text-[#315C47]">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-medium text-[#354B3D]">
                      CEN AI analysis
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#829287]">
                      The image is submitted to the configured analysis backend.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDF4EC] text-xs font-bold text-[#315C47]">
                    3
                  </span>

                  <div>
                    <p className="text-sm font-medium text-[#354B3D]">
                      Review results
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#829287]">
                      Review the returned assessment and recommendations.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </aside>
        </div>

        <footer className="border-t border-[#E1E7DF] pt-4 text-center text-xs text-[#829287]">
          EnFarm · Agricultural Officer Workspace
        </footer>

      </div>
    </motion.div>
  );
}
