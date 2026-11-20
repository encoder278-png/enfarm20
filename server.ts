import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import { getFarmer, saveFarmer } from "./src/memoryService";
import twilio from "twilio";

dotenv.config();
import rateLimit from "express-rate-limit";

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per 15 minutes
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lazy initialization of Gemini client (images only)


// Groq client (all text conversations)
function getGroqClient(): OpenAI {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "" || key === "YOUR_GROQ_API_KEY") {
    throw new Error("API_KEY_MISSING");
  }
  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

type CropAssessment = {
  isPlant: boolean | null;
  crop: string;
  healthScore: number | null;
  riskLevel: string;
  diagnosis: string;
  severity: string;
  confidence: number;
  recommendations: string[];
  summary: string;
};

async function analyzeCropImage(
  imageBase64: string,
  mimeType: string,
  cropTypePrompt?: string
): Promise<CropAssessment> {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const rawBase64 = imageBase64.replace(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
    ""
  );

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Unsupported image format.");
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(rawBase64)) {
    throw new Error("Invalid image encoding.");
  }

  const imageBuffer = Buffer.from(rawBase64, "base64");

  if (!imageBuffer.length || imageBuffer.length > 10 * 1024 * 1024) {
    throw new Error("Image must be smaller than 10 MB.");
  }

  const client = getGroqClient();

  const prompt = `
You are CEN, the EnFarm agricultural image assessment assistant
for Tanzanian smallholder farmers.

FIRST: VALIDATE THE IMAGE.

Determine whether the image clearly contains a real plant or crop.

If there is clearly NO plant:
- isPlant: false
- crop: "Unknown"
- healthScore: null
- riskLevel: "Unknown"
- diagnosis: "Hakuna mmea uliotambuliwa kwenye picha."
- severity: "Unknown"
- confidence: 0
- recommendations: []
- summary: "Picha haina mmea unaoweza kuchunguzwa."

If the image is blurry or unclear:
- isPlant: null
- crop: "Unknown"
- healthScore: null
- riskLevel: "Unknown"
- diagnosis: "Picha haieleweki vizuri. Tafadhali tuma picha nyingine."
- severity: "Unknown"
- confidence: 0
- recommendations: []
- summary: "Picha haitoshi kufanya tathmini."

ONLY IF A PLANT IS CLEARLY VISIBLE:

Analyze crops common in Tanzania:
maize, cassava, rice, sunflower and beans.

Identify visible symptoms only.
Do not invent diseases, pests, deficiencies or symptoms.
Distinguish visible symptoms from possible causes.
Do not claim a disease is confirmed from an image alone.

Use simple Swahili for all farmer-facing text.
The crop field may use the crop's English name.

Confidence must be between 0 and 1.
Health score must be an integer from 0 to 100,
or null if it cannot be reasonably assessed.

If evidence is insufficient, say so clearly.

${cropTypePrompt ? `The farmer thinks this crop is: ${cropTypePrompt}. Treat this as a suggestion, not a confirmed identification.` : ""}

Return ONLY a valid JSON object with these fields:

{
  "isPlant": true,
  "crop": "Maize",
  "healthScore": 80,
  "riskLevel": "Low",
  "diagnosis": "Maelezo ya dalili zinazoonekana.",
  "severity": "Mild",
  "confidence": 0.75,
  "recommendations": ["Hatua ya kwanza"],
  "summary": "Muhtasari mfupi wa tathmini."
}
`;

  const completion = await client.chat.completions.create({
    model: GROQ_VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${rawBase64}`
            }
          }
        ]
      }
    ],
    response_format: {
      type: "json_object"
    },
    max_completion_tokens: 800,
    temperature: 0.2
  });

  const responseText =
    completion.choices[0]?.message?.content;

  if (!responseText || typeof responseText !== "string") {
    throw new Error("Groq Vision returned an empty response.");
  }

  const parsed = JSON.parse(responseText);

  const isPlant =
    parsed.isPlant === true
      ? true
      : parsed.isPlant === false
      ? false
      : null;

  // Never save a diagnosis for a non-plant or unclear image.
  if (isPlant !== true) {
    return {
      isPlant,
      crop: "Unknown",
      healthScore: null,
      riskLevel: "Unknown",
      diagnosis:
        isPlant === false
          ? "Hakuna mmea uliotambuliwa kwenye picha."
          : "Picha haieleweki vizuri. Tafadhali tuma picha nyingine.",
      severity: "Unknown",
      confidence: 0,
      recommendations: [],
      summary:
        isPlant === false
          ? "Picha haina mmea unaoweza kuchunguzwa."
          : "Picha haitoshi kufanya tathmini."
    };
  }

  const healthScore =
    typeof parsed.healthScore === "number" &&
    Number.isInteger(parsed.healthScore) &&
    parsed.healthScore >= 0 &&
    parsed.healthScore <= 100
      ? parsed.healthScore
      : null;

  const confidence =
    typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0;

  return {
    isPlant: true,
    crop: typeof parsed.crop === "string" ? parsed.crop : "Unknown",
    healthScore,
    riskLevel:
      typeof parsed.riskLevel === "string"
        ? parsed.riskLevel
        : "Unknown",
    diagnosis:
      typeof parsed.diagnosis === "string"
        ? parsed.diagnosis
        : "Tathmini haijakamilika.",
    severity:
      typeof parsed.severity === "string"
        ? parsed.severity
        : "Unknown",
    confidence,
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter(
          (item: unknown): item is string =>
            typeof item === "string"
        )
      : [],
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Tathmini ya picha imekamilika."
  };
}


// Approximate coordinates for Tanzania regions — add more as real farmers mention them
const TANZANIA_REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  "mbeya": { lat: -8.9, lon: 33.45 },
  "kilimanjaro": { lat: -3.35, lon: 37.33 },
  "arusha": { lat: -3.37, lon: 36.68 },
  "dodoma": { lat: -6.17, lon: 35.74 },
  "morogoro": { lat: -6.82, lon: 37.66 },
  "mwanza": { lat: -2.52, lon: 32.90 },
  "iringa": { lat: -7.77, lon: 35.69 },
  "tanga": { lat: -5.07, lon: 39.10 },
  "singida": { lat: -4.82, lon: 34.74 },
};

async function getWeatherForRegion(regionName: string): Promise<string | null> {
  const key = regionName.toLowerCase().trim();
  const coords = TANZANIA_REGION_COORDS[key];
  if (!coords) return null;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,precipitation,relative_humidity_2m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Africa%2FNairobi&forecast_days=3`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.stringify(data);
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return null;
  }
}
function extractProfile(text: string, justAskedForProfile: boolean = false) {
  const regions = [
    "mbeya", "iringa", "arusha", "kilimanjaro", "dodoma",
    "morogoro", "mwanza", "tanga", "singida"
  ];
  const crops = [
    "mahindi", "muhogo", "mpunga", "alizeti", "maharage", "nyanya"
  ];

  let region = null;
  for (const r of regions) {
    if (text.toLowerCase().includes(r)) region = r;
  }

  let crop = null;
  for (const c of crops) {
    if (text.toLowerCase().includes(c)) crop = c;
  }

  let name = null;
  const patterns = [
    /mimi ni\s+([a-z]+)/i,
    /jina langu ni\s+([a-z]+)/i,
    /naitwa\s+([a-z]+)/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { name = m[1]; break; }
  }

  if (!name && justAskedForProfile) {
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const farmingKeywords = /tatizo|ugonjwa|nini|shamba|mvua|dawa/i;
    const looksLikeBareName =
      words.length <= 3 &&
      /^[a-zA-Z\s]+$/.test(trimmed) &&
      !farmingKeywords.test(trimmed) &&
      !crops.includes(trimmed.toLowerCase());

    if (looksLikeBareName) {
      const nameWords = words.filter(
        w => !regions.includes(w.toLowerCase()) && !crops.includes(w.toLowerCase())
      );
      if (nameWords.length > 0) name = nameWords[0];
    }
  }

  return { name, region, crop };
}

function buildFarmerContext(farmer: any): string {
  if (!farmer) {
    return `
TAARIFA ZA MKULIMA:
Hakuna historia ya awali.
`;
  }

  const recentDiseases = (farmer.diseases || [])
    .slice(-3)
    .map((d: any) =>
      `${d.cropType || "?"}: ${d.diagnosis || "?"} (${d.severity || "?"})`
    )
    .join(", ");

  const recentChats = (farmer.conversations || [])
    .slice(-3)
    .map((c: any) =>
      `${c.role}: ${c.text}`
    )
    .join("\n");

  return `
TAARIFA ZA MKULIMA:

Jina:
${farmer.name || "Haijulikani"}

Mkoa:
${farmer.region || "Haijulikani"}

Mazao:
${(farmer.crops || []).join(", ") || "Haijulikani"}

Magonjwa ya hivi karibuni:
${recentDiseases || "Hakuna"}

Mazungumzo ya hivi karibuni:
${recentChats || "Hakuna"}
`;
}

function buildFarmerReport(farmer: any): string {
  if (!farmer || !(farmer.conversations?.length || farmer.diseases?.length)) {
    return "Bado hujaanza kutumia EnFarm. Tuma swali lako la kwanza la kilimo ili nianze kukusaidia!";
  }

  const joinedDate = farmer.joinedAt
    ? new Date(farmer.joinedAt).toLocaleDateString("sw-TZ", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Haijulikani";

  const conversations = farmer.conversations || [];
  const assessments = farmer.diseases || [];

  const totalQuestions = conversations.filter(
    (c: any) => c.role === "farmer"
  ).length;

  const imageAssessments = assessments.filter(
    (d: any) => d.source === "whatsapp_image"
  ).length;

  const conversationAssessments = assessments.filter(
    (d: any) =>
      d.source === "whatsapp_conversation" ||
      d.source === "web_conversation"
  ).length;

  const legacyAssessments = assessments.filter(
    (d: any) => !d.source
  ).length;

  const totalDiagnoses = assessments.length;

  const assessmentList = assessments
    .slice(-5)
    .reverse()
    .map((d: any, i: number) => {
      const date = d.timestamp
        ? new Date(d.timestamp).toLocaleDateString("sw-TZ", {
            day: "numeric",
            month: "short"
          })
        : "Tarehe haijulikani";

      const source =
        d.source === "whatsapp_image"
          ? "Picha"
          : d.source === "whatsapp_conversation"
          ? "Mazungumzo ya WhatsApp"
          : d.source === "web_conversation"
          ? "Mazungumzo ya mtandao"
          : "Rekodi ya zamani";

      return `${i + 1}. ${d.cropType || "Zao lisilojulikana"}: ${d.diagnosis || "Tathmini haijakamilika"} (${source}, ${date})`;
    })
    .join("\n");

  return `*RIPOTI YAKO - EnFarm*

Jina: ${farmer.name || "Haijulikani"}
Mkoa: ${farmer.region || "Haijulikani"}
Umetumia EnFarm tangu: ${joinedDate}

*MATUMIZI YA ENFARM*
Maswali uliyouliza: ${totalQuestions}

*TAHMINI ZA MAZAO*
Jumla ya tathmini: ${totalDiagnoses}
Uchunguzi kupitia picha: ${imageAssessments}
Tathmini kupitia mazungumzo: ${conversationAssessments}
Rekodi za zamani zisizo na chanzo: ${legacyAssessments}

${totalDiagnoses > 0
  ? `*TATHMINI ZA HIVI KARIBUNI:*\n${assessmentList}`
  : "Bado hakuna tathmini za mazao zilizohifadhiwa."}

Endelea kutumia EnFarm kupata msaada zaidi wa shamba lako!`;
}


async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = Number(process.env.PORT) || 3000;

  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API Route: Health Check

app.get("/api/health", (req, res) => {
  const groqConfigured = !!process.env.GROQ_API_KEY;

  res.json({
    status: "ok",
    platform: "EnFarm Crop Intelligence Server",
    geminiConfigured: false,
    groqConfigured,
    groqVisionConfigured: groqConfigured,
    timestamp: new Date().toISOString()
  });
});


  // API Route: AI Assistant Chat

app.post("/api/chat", aiRateLimit, async (req, res) => {
  try {
    const { message, history, farmerId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message parameter is required."
      });
    }

    // Load the farmer's existing memory first
    let farmerMemory: any = null;

    if (farmerId) {
      try {
        farmerMemory = await getFarmer(farmerId);
      } catch (err) {
        console.error("Farmer memory load error:", err);
      }
    }

    const memoryContext = buildFarmerContext(farmerMemory);

    let client: OpenAI;

    try {
      client = getGroqClient();
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        return res.status(503).json({
          error: "CEN AI is temporarily unavailable. Please try again later.",
          code: "CHAT_AI_UNAVAILABLE"
        });
      }
      throw err;
    }

    const systemInstruction = `
${memoryContext}

You are CEN, the EnFarm AI agricultural assistant for Tanzanian smallholder farmers.

LANGUAGE: Always respond in simple Swahili. Use English only for scientific crop or disease names, and immediately explain them in Swahili.

YOUR FOCUS CROPS: Mahindi (maize), Muhogo (cassava), Mpunga (rice), Alizeti (sunflower), Maharage (beans).

RULES:
1. Respond directly to the farmer's question.
2. If a farmer describes a crop problem, ask one clarifying question OR ask for a photo before diagnosing.
3. When diagnosing disease, give the Swahili name first, then treatment in simple numbered steps.
4. Keep responses short.
5. Never recommend products a Tanzanian farmer cannot find locally.
6. End every response with one simple action the farmer can take today.
7. If asked anything unrelated to farming, politely redirect back to agriculture.
`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstruction }
    ];

    if (history && Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (!h || typeof h.text !== "string") continue;

        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.text
        });
      }
    }

    messages.push({
      role: "user",
      content: message
    });

    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse =
      completion.choices[0]?.message?.content ||
      "Samahani, sikuweza kupata jibu. Jaribu tena.";

    // Save the exchange AFTER CEN has generated its answer
    if (farmerId) {
      try {
        const now = new Date().toISOString();

        await saveFarmer(farmerId, {
          ...(farmerMemory || {}),
          farmerId,

          conversations: [
            ...(farmerMemory?.conversations || []).slice(-9),
            {
              role: "farmer",
              text: message,
              timestamp: now
            },
            {
              role: "cen",
              text: aiResponse,
              timestamp: now
            }
          ],

          lastMessage: message,
          lastResponse: aiResponse,
          lastActive: now
        });
      } catch (err) {
        console.error("Web chat memory save error:", err);
      }
    }

    res.json({
      text: aiResponse,
      groundingSources: []
    });

  } catch (error: any) {
    console.error("Chat API error:", error);

    res.status(500).json({
      error: error.message || "Internal Farm Engine error."
    });
  }
});


  
// API Route: Image Analysis — Groq Vision
app.post("/api/analyze-image", aiRateLimit, async (req, res) => {
  try {
    const { imageBase64, mimeType, cropTypePrompt } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        error: "Image payload is required."
      });
    }

    if (imageBase64.length > 15 * 1024 * 1024) {
      return res.status(413).json({
        error: "Image payload is too large."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "Image analysis is temporarily unavailable.",
        code: "IMAGE_AI_UNAVAILABLE"
      });
    }

    const assessment = await analyzeCropImage(
      imageBase64,
      mimeType || "image/jpeg",
      cropTypePrompt
    );

    return res.json(assessment);

  } catch (error: any) {
    console.error("Groq Vision image analysis error:", error);
    if (error?.status === 429) {
  return res.status(429).json({
    error: "Image analysis is temporarily busy. Please try again shortly.",
    code: "VISION_RATE_LIMIT"
  });
}

    return res.status(502).json({
      error: "Image analysis failed. Please try again.",
      code: "IMAGE_ANALYSIS_FAILED"
    });
  }
});

      // Strip potential visual prefixes
   
  // ── WhatsApp Bot ──────────────────────────────────────────────────────────
  app.post(
  "/api/whatsapp",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();

    try {
      const incomingMsg = req.body.Body?.trim() || "";
      const farmerPhone  = req.body.From || "";
      const farmerId     = `wa_${farmerPhone.replace("whatsapp:+", "")}`;
      const numMedia     = parseInt(req.body.NumMedia || "0");

      let farmer: any = null;
      try {
        farmer = await getFarmer(farmerId);
      } catch {}

      let replyText = "";

      if (incomingMsg.trim().toLowerCase() === "/repoti") {
        replyText = buildFarmerReport(farmer);
        twiml.message(replyText);
        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(twiml.toString());
        return;
      }

      if (numMedia > 0) {
        // Farmer sent a PHOTO — UNCHANGED, still uses Gemini
        const imageUrl = req.body.MediaUrl0;
        // Validate the URL is actually from Twilio's CDN before fetching with credentials
const twilioMediaHostPattern = /^https:\/\/api\.twilio\.com\//;
if (!twilioMediaHostPattern.test(imageUrl)) {
  console.error("Rejected non-Twilio media URL:", imageUrl);
  replyText = "Samahani, sikuweza kupokea picha. Tuma tena.";
  twiml.message(replyText);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
  return;
}

const authString = Buffer.from(
  `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
).toString("base64");

const imageResp = await fetch(imageUrl, {
  headers: { Authorization: `Basic ${authString}` },
});
        if (!imageResp.ok) {
  throw new Error(`Twilio image download failed: ${imageResp.status}`);
}

if (!imageResp.headers.get("content-type")?.startsWith("image/")) {
  throw new Error("The received media is not an image.");
}
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image  = Buffer.from(imageBuffer).toString("base64");
      const mimeType = (
  imageResp.headers.get("content-type") || "image/jpeg"
)
  .split(";")[0]
  .trim()
  .toLowerCase();

const imageAssessment = await analyzeCropImage(
  base64Image,
  mimeType
);

// Only save a diagnosis when the image clearly contains a plant.
const diagnosisRecord =
  imageAssessment.isPlant === true
    ? imageAssessment
    : null;

if (imageAssessment.isPlant === true) {
  const steps = imageAssessment.recommendations
    .slice(0, 3)
    .map((r: string, i: number) => `${i + 1}. ${r}`)
    .join("\n");

  replyText =
    `*${imageAssessment.diagnosis}*\n` +
    `Zao: ${imageAssessment.crop}\n` +
    `Ukali: ${imageAssessment.severity}\n\n` +
    `${steps}`;
} else if (imageAssessment.isPlant === false) {
  replyText =
    "Picha hii haionyeshi mmea unaoweza kuchunguzwa. Tafadhali tuma picha ya zao lako.";
} else {
  replyText =
    "Picha haieleweki vizuri. Tafadhali tuma picha iliyo wazi ya jani lililoathirika.";
}
        // Save structured diagnosis + conversation log
        const updated = {
          ...(farmer || { farmerId, crops: [], diseases: [], conversations: [] }),
          farmerId,
          joinedAt: farmer?.joinedAt ?? new Date().toISOString(),


diseases: [
  ...(farmer?.diseases || []),
  ...(diagnosisRecord ? [
    {
      source: "whatsapp_image",
      cropType: diagnosisRecord.crop ?? null,
      diagnosis: diagnosisRecord.diagnosis ?? null,
      severity: diagnosisRecord.severity ?? null,
      healthScore: diagnosisRecord.healthScore ?? null,
      confidence: diagnosisRecord.confidence ?? null,
      treatment: diagnosisRecord.recommendations || [],
      outcome: null,
      recoveryDays: null,
      timestamp: new Date().toISOString(),
    }
  ] : []),
],

          conversations: [
            ...((farmer?.conversations || []).slice(-9)),
            { role: "farmer", text: "[Alituma picha ya zao]", timestamp: new Date().toISOString() },
            { role: "cen",    text: replyText,                timestamp: new Date().toISOString() },
          ],
          lastActive: new Date().toISOString(),
        };
      try {
  await saveFarmer(farmerId, updated);
} catch (err) {
  console.error("WhatsApp image assessment save failed:", err);
}
      } else if (incomingMsg) {
        // Reply instantly so Twilio doesn't time out — real answer follows as a separate message
        twiml.message("Ninachunguza swali lako, nitajibu kwa muda mfupi...");
        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(twiml.toString());

        // Everything below runs AFTER Twilio already has its response —
        // errors here can't be sent back via twiml anymore, so we send
        // the real answer as a follow-up message instead.
        (async () => {
          try {
  const groqClient = getGroqClient();

  const recentHistory = (farmer?.conversations || []).slice(-10);

  // Build farmer memory context (this was missing entirely on WhatsApp)
  const farmerName   = farmer?.name || null;
const farmerRegion = farmer?.region || null;
const knownCrops    = farmer?.crops?.length ? farmer.crops.join(", ") : null;
const pastDiseases  = farmer?.diseases?.length
  ? farmer.diseases.slice(-3).map((d: any) => `${d.cropType || "?"}: ${d.diagnosis} (${d.timestamp?.slice(0,10) || ""})`).join("; ")
  : null;

  // Check if farmer is asking about weather, and fetch real data if we know their region
  let weatherInfo: string | null = null;
  const askedAboutWeather = /hali ya hewa|mvua|jua kali|joto|baridi|nivune|kuvuna|wakati wa kuvuna|nipande|kupanda/i.test(incomingMsg);
  if (askedAboutWeather && farmerRegion) {
    weatherInfo = await getWeatherForRegion(farmerRegion);
  }

  const memoryContext = farmer
    ? `
TAARIFA ZA MKULIMA HUYU (tumia bila kuuliza tena kama unazo):
- Jina: ${farmerName || "Haijulikani bado"}
- Mkoa: ${farmerRegion || "Haijulikani bado"}
- Mazao anayolima: ${knownCrops || "Haijulikani bado"}
- Historia ya magonjwa: ${pastDiseases || "Hakuna rekodi"}
${weatherInfo ? `- Taarifa za hali ya hewa za sasa kwa ${farmerRegion}: ${weatherInfo}` : ''}
`
    : `
TAARIFA ZA MKULIMA: Hakuna rekodi ya awali — huyu ni mkulima mpya.
`;
// Detect if we still need to collect basic profile info
  const needsProfile = !farmer?.name || !farmer?.region;
  // Only ASK if we haven't already asked before — avoids nagging every message
  const ASK_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const lastAsked = farmer?.profileAskedAt ? new Date(farmer.profileAskedAt).getTime() : 0;
const cooldownPassed = Date.now() - lastAsked > ASK_COOLDOWN_MS;
const shouldAskNow = needsProfile && (!farmer?.profileAskedAt || cooldownPassed);

  const extracted = extractProfile(incomingMsg, shouldAskNow || !!farmer?.profileAskedAt);

if(extracted.name){
   farmer = { ...(farmer || {}), name: extracted.name };
}

if(extracted.region){
   farmer = { ...(farmer || {}), region: extracted.region };
}

if(extracted.crop && !(farmer?.crops || []).includes(extracted.crop)){
   farmer = { ...(farmer || {}), crops: [...(farmer?.crops || []), extracted.crop] };
}

 const systemInstruction = `
${memoryContext}

Wewe ni CEN, mfumo wa maamuzi ya kilimo wa EnFarm kwa wakulima wadogo Tanzania.

LENGO: Kazi yako si kuonekana mwerevu. Kazi yako ni kupunguza hasara za mkulima na kuepuka ushauri usio sahihi. Jibu lisilo sahihi linaweza kugharimu mavuno ya msimu mzima.

MUKTADHA: Nyanda za Juu Kusini (Iringa, Njombe, Mbeya, Songwe, Rukwa) ni ghala kuu la mahindi. Matatizo ya kawaida: Kiwavi Jeshi, funza wa bua, Striga, Maize Streak Virus, Northern Leaf Blight, upungufu wa nitrojeni, upungufu wa fosforasi (husababisha rangi ya pinki/zambarau kwenye majani, hasa kingo za majani), ukame, udongo wa asidi, hasara za ghalani (zaidi ya 50% ya nafaka). Mazao mengine: Muhogo (Cassava Mosaic, Brown Streak - wadudu weupe), Alizeti, Mpunga, Maharage.

SHERIA ZA MSINGI:
1. Jibu kwa Kiswahili rahisi, MAFUPI - mkulima anasoma kwenye simu ndogo. USITUMIE vichwa vya habari virefu (UCHAMBUZI:, SABABU:, n.k) - andika kama mazungumzo ya kawaida, si ripoti.
2. Kama unajua jina la mkulima, mtumie. Usiulize tena jina/mkoa ulizojua tayari.
${shouldAskNow ? `3. Hatujui jina, mkoa, au zao lake bado - uliza kwa upole MWISHONI baada ya kujibu swali lake, kwa mfano: "Kabla tusonge mbele, jina lako ni nani, unakaa mkoa gani, na unalima zao gani?"` : ''}
4. Tumia historia ya magonjwa/mazungumzo uliyo nayo ili kuunganisha na hali ya zamani.

USIBAHATISHE:
5. Kama taarifa hazitoshi, sema wazi: "Sina taarifa za kutosha kuthibitisha tatizo." Kukubali kutokujua ni bora kuliko kubahatisha.
6. Kama kuna dalili kadhaa kwa wakati mmoja, taja UWEZEKANO WOTE kwa asilimia tofauti (mfano: Kiwavi Jeshi 85%, Upungufu wa Nitrojeni 60%), kwa mpangilio mkubwa kwenda mdogo - si jibu moja la uhakika.
6b. TUMIA TAKWIMU KILA MAHALI ZINAPOPATIKANA: Kama mkulima ametaja asilimia, eneo (ekari), bajeti, au idadi yoyote, ZITUMIE moja kwa moja kwenye hesabu na hoja yako - usitoe maneno ya jumla kama "itazidi kuwa mbaya" bila kukadiria KIASI (mfano: "eneo lililoathirika linaweza kuongezeka kutoka 20% hadi karibu 35-40% ndani ya siku tatu kama hautachukua hatua").
6c. KAMA TATIZO LINAATHIRI ENEO/ASILIMIA KUBWA ZAIDI YA SHAMBA (mfano: ukame unaoathiri shamba lote dhidi ya wadudu wanaoathiri sehemu ndogo), lipe KIPAUMBELE TATIZO LINALOATHIRI ZAIDI hata kama si la haraka zaidi - usigawanye bajeti/muda sawasawa kati ya matatizo bila kuzingatia ukubwa wa hatari ya kila moja.
6d. Kama sehemu ya zao tayari imeathirika (mfano: 20% ya mimea ina viwavi), ZITENGANISHE hatua za sehemu iliyoathirika (tibu sasa, bila kujali muda) na sehemu ambayo bado haijaathirika (uamuzi wa muda unahusu hii pekee).

7. Dalili alizoziona mkulima moja kwa moja (wadudu, mistari, rangi) ni ushahidi mkubwa zaidi kuliko hitimisho lako la jumla.
8. Asilimia ya uhakika inategemea UBORA wa ushahidi - dalili moja wazi na ya pekee = uhakika mkubwa (80%+); dalili zisizo wazi au nyingi zinazoshindana = uhakika wa wastani. Usiwe na uhakika mdogo bila sababu wakati ushahidi ni mzuri, wala usiwe na uhakika mkubwa bila msingi.
9. Tambua taarifa zisizo za kawaida (mfano: mahindi ya wiki mbili kutoa mahindi) - lakini kuwa mwangalifu: hii ni kwa madai yasiyowezekana KABISA, si kwa matukio nadra lakini ya kweli. Kama una shaka, uliza badala ya kukataa moja kwa moja.
9b. RANGI ISIYO YA KAWAIDA: Kama mkulima ameeleza rangi isiyo ya kawaida kwenye majani (pinki, zambarau, bluu), ANGALIA KWANZA upungufu wa virutubisho (hasa fosforasi kwa rangi ya pinki/zambarau) KABLA ya kutaja magonjwa yenye majina - upungufu wa virutubisho ni chanzo cha kawaida zaidi cha rangi hizi kuliko magonjwa mengi.
9c. SHERIA 6 NA 8 ZINATUMIKA KWA KILA JIBU LA UTAMBUZI, IKIWEMO MAJIBU YA KUENDELEA (follow-up) - si tu ujumbe wa kwanza. Kila utambuzi wa dalili lazima uwe na asilimia, hata kama ni ujumbe wa pili au wa tatu kwenye mazungumzo.
UCHUMI:
10. Kama mkulima anachagua kati ya uwekezaji kadhaa kwa fedha chache: pendekeza chaguo bora, eleza kwa nini ulikataa chaguo zingine, tumia takwimu alizotaja (bei, asilimia ya mvua), na taja hatari ya pendekezo lako.

HALI YA HEWA: 11. Tumia tu taarifa za hali ya hewa ulizopewa hapo juu. Kama hazipo, sema wazi hujui - USIBUNI.

HATUA: 12. Kila jibu la utambuzi liwe na hatua za saa 48 zijazo kwa kila uwezekano mkubwa, hata ukiuliza picha kwa uthibitisho.

PICHA: 13. Kama picha haitoshi kuwa na uhakika, sema wazi na uombe picha maalum (jani lililoathirika, mdudu, shamba kwa ujumla) - usijifanye una uhakika.

HISIA: 14. Kama mkulima ana hasara kubwa au anauliza maamuzi makubwa (kuacha kilimo): kubali uzito wa hali kwa sentensi moja KWANZA, toa taarifa, lakini USIMFANYIE uamuzi mkubwa wa fedha - mshauri kuwasiliana na MVIWATA au afisa ugani kwa maamuzi makubwa.

Ukilazimika kuchagua kati ya kuonekana mwerevu au kukiri kutokuwa na uhakika - chagua kukiri. Kubahatisha ni kushindwa.
`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemInstruction },
          ...recentHistory.map((h: any) => ({
            role: (h.role === "farmer" ? "user" : "assistant") as "user" | "assistant",
            content: h.text,
          })),
          { role: "user", content: incomingMsg },
        ];

        const completion = await groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages,
          max_tokens: 400,
          temperature: 0.1,
        });

        replyText = completion.choices[0]?.message?.content || "Samahani, jaribu tena.";

        // Run remaining extraction calls in PARALLEL, not one-after-another — cuts latency significantly
        const extractionPromises: Promise<void>[] = [];

        if (needsProfile) {
          extractionPromises.push(
            groqClient.chat.completions.create({
              model: GROQ_MODEL,
              messages: [{
                role: "system",
                content: `Toa jina na mkoa kutoka kwenye ujumbe huu kama vipo. Jibu JSON tu: {"name": "..." au null, "region": "..." au null}. Kama hakuna taarifa, rudisha null kwa vyote.`
              }, {
                role: "user",
                content: incomingMsg
              }],
              max_tokens: 80,
              temperature: 0,
            }).then((extraction) => {
              try {
                const parsed = JSON.parse(
                  (extraction.choices[0]?.message?.content || "{}").replace(/```json|```/g, "").trim()
                );
                if (parsed.name) farmer = { ...(farmer || {}), name: parsed.name };
                if (parsed.region) farmer = { ...(farmer || {}), region: parsed.region };
              } catch { /* ignore parse failures */ }
            }).catch(() => {})
          );
        }
        // Check if this exchange was a diagnosis worth logging structurally — runs in parallel too
        let textDiagnosis: any = null;
        extractionPromises.push(
          groqClient.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{
              role: "system",
              content: `Angalia mazungumzo haya. Kama CEN alitoa UTAMBUZI wa tatizo la zao (ugonjwa, wadudu, upungufu wa virutubisho) - si swali la jumla wala salamu - toa JSON: {"isDiagnosis": true, "cropType": "...", "diagnosis": "...", "severity": "Mild/Moderate/Severe au null", "confidence": 0.0-1.0}. Kama sio utambuzi, rudisha {"isDiagnosis": false}.`
            }, {
              role: "user",
              content: `Mkulima: ${incomingMsg}\nCEN: ${replyText}`
            }],
            max_tokens: 150,
            temperature: 0,
          }).then((diagExtraction) => {
            try {
              const parsed = JSON.parse(
                (diagExtraction.choices[0]?.message?.content || "{}").replace(/```json|```/g, "").trim()
              );
              if (parsed.isDiagnosis) textDiagnosis = parsed;
            } catch { /* ignore parse failures */ }
          }).catch(() => {})
        );

        await Promise.all(extractionPromises);

        // Save to Firestore — UNCHANGED
        const updated = {
  ...(farmer || { farmerId, crops: [], diseases: [], conversations: [] }),
  farmerId,
  joinedAt: farmer?.joinedAt ?? new Date().toISOString(),
  name: farmer?.name ?? null,
  region: farmer?.region ?? null,
  profileAskedAt: (shouldAskNow ? new Date().toISOString() : farmer?.profileAskedAt) ?? null,
 


diseases: [
  ...(farmer?.diseases || []),
  ...(textDiagnosis ? [
    {
      source: "whatsapp_conversation",
      cropType: textDiagnosis.cropType ?? null,
      diagnosis: textDiagnosis.diagnosis ?? null,
      severity: textDiagnosis.severity ?? null,
      healthScore: null,
      confidence: textDiagnosis.confidence ?? null,
      timestamp: new Date().toISOString(),
    }
  ] : []),
],


      conversations: [
    ...((farmer?.conversations || []).slice(-9)),
    { role: "farmer", text: incomingMsg, timestamp: new Date().toISOString() },
    { role: "cen",    text: replyText,   timestamp: new Date().toISOString() },
  ],
  lastActive: new Date().toISOString(),
};
try { await saveFarmer(farmerId, updated); } catch (err) { console.error("Save failed for", farmerId, err); }

            
// Send CEN's actual answer to the farmer through WhatsApp
const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const configuredFrom = process.env.TWILIO_WHATSAPP_NUMBER?.trim();

if (!accountSid || !authToken || !configuredFrom) {
  throw new Error(
    "WhatsApp delivery failed: Twilio environment variables are missing."
  );
}

if (!farmerPhone.startsWith("whatsapp:+")) {
  throw new Error(
    `Invalid WhatsApp destination: ${farmerPhone}`
  );
}

const whatsappFrom = configuredFrom.startsWith("whatsapp:")
  ? configuredFrom
  : `whatsapp:${configuredFrom.startsWith("+") ? configuredFrom : "+" + configuredFrom}`;

const whatsappClient = twilio(accountSid, authToken);

const sentMessage = await whatsappClient.messages.create({
  from: whatsappFrom,
  to: farmerPhone,
  body: replyText,
});

console.log("CEN WHATSAPP DELIVERY:", {
  farmer: farmerPhone,
  messageSid: sentMessage.sid,
  status: sentMessage.status,
});
                      } catch (err) {
            console.error("Async WhatsApp text handling error:", err);
          }
        })();

        return;
      } else {
        replyText = "Samahani, sijapata ujumbe wako. Tafadhali jaribu tena.";
      }

      
      twiml.message(replyText);

    } catch (error) {
      console.error("WhatsApp webhook error:", error);

      // Only send an error response if Twilio has not received one yet.
      if (!res.headersSent) {
        twiml.message(
          "Samahani, kuna tatizo. Jaribu tena baadaye."
        );
        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(twiml.toString());
      }
    }

  }
);
  // Manual reply from admin to farmer via WhatsApp — UNCHANGED
  app.post("/api/whatsapp-send", aiRateLimit, async (req, res) => {
    try {
      const providedKey = req.headers["x-admin-key"];
      if (!providedKey || providedKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ error: "to and message are required" });
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const from       = process.env.TWILIO_WHATSAPP_NUMBER;

      if (!accountSid || !authToken || !from) {
        return res.status(500).json({ error: "Twilio not configured" });
      }

      const client = twilio(accountSid, authToken);
      await client.messages.create({
        from,
        to: `whatsapp:+${to.replace("+", "")}`,
        body: message,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Send error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: AI recommendations — switched to Groq
  app.get("/api/recommendations", aiRateLimit, async (req, res) => {
const fallback = {
  pestControl: "Ushauri haupatikani kwa sasa. Tafadhali jaribu tena baadaye.",
  irrigation: "Ushauri haupatikani kwa sasa. Tafadhali jaribu tena baadaye.",
  fertilization: "Ushauri haupatikani kwa sasa. Tafadhali jaribu tena baadaye.",
  harvesting: "Ushauri haupatikani kwa sasa. Tafadhali jaribu tena baadaye."
};
  try {
    const client = getGroqClient();

    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "Wewe ni mshauri wa kilimo wa Tanzania. Jibu kwa JSON tu, bila maelezo mengine."
        },
        {
          role: "user",
          content: `Toa ushauri mfupi wa kilimo kwa Kiswahili kwa maeneo manne.
Jibu kwa JSON hii hasa, bila kitu kingine chochote:
{
  "pestControl": "sentensi moja",
  "irrigation": "sentensi moja",
  "fertilization": "sentensi moja",
  "harvesting": "sentensi moja"
}`
        }
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));

  } catch (e) {
    console.error("Recommendations error:", e);
    res.json(fallback);
  }
});

  // Vite middleware for development — UNCHANGED
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EnFarm Crop Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
