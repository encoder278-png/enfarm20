import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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
function getGeminiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key === '""' || key === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: key });
}

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
    ? new Date(farmer.joinedAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long", year: "numeric" })
    : "Haijulikani";

  const totalQuestions = (farmer.conversations || []).filter((c: any) => c.role === "farmer").length;
  const totalDiagnoses = (farmer.diseases || []).length;

  const diseaseList = (farmer.diseases || [])
    .slice(-5)
    .map((d: any, i: number) => {
      const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString("sw-TZ", { day: "numeric", month: "short" }) : "?";
      return `${i + 1}. ${d.cropType || "Zao lisilojulikana"}: ${d.diagnosis || "?"} (${date})`;
    })
    .join("\n");

  return `*RIPOTI YAKO - EnFarm*

Jina: ${farmer.name || "Haijulikani"}
Mkoa: ${farmer.region || "Haijulikani"}
Umetumia EnFarm tangu: ${joinedDate}

Maswali uliyouliza: ${totalQuestions}
Uchunguzi wa picha: ${totalDiagnoses}

${totalDiagnoses > 0 ? `*Magonjwa/matatizo ya hivi karibuni:*\n${diseaseList}` : "Bado hujatuma picha yoyote ya uchunguzi."}

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
    const geminiConfigured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    const groqConfigured = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "YOUR_GROQ_API_KEY";
    res.json({
      status: "ok",
      platform: "EnFarm Crop Intelligence Server",
      geminiConfigured,
      groqConfigured,
      timestamp: new Date().toISOString()
    });
  });

  // API Route: AI Assistant Chat
  app.post("/api/chat", aiRateLimit, async (req, res) => {
    try {
      const { message, history, farmerId } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message parameter is required." });
      }
      let farmerMemory = null;

if (farmerId) {
  try {
    farmerMemory = await getFarmer(farmerId);
    console.log("Farmer memory loaded:", farmerMemory);
  } catch (err) {
    console.error("Memory load error:", err);
  }
}

const memoryContext =
  buildFarmerContext(farmerMemory);

   
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
1. Respond directly to the farmer's question. No unnecessary introduction.
2. If a farmer describes a crop problem, ask one clarifying question OR ask for a photo before diagnosing.
3. When diagnosing disease, give the Swahili name first, then the treatment in simple numbered steps.
4. Keep responses short. Farmers read on small slow phones.
5. Never recommend products a Tanzanian farmer cannot find locally.
6. End every response with one simple action the farmer can take today.
7. If asked anything unrelated to farming, politely redirect back to agriculture.
`;

      // Build messages array for Groq
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction }
      ];

      if (history && Array.isArray(history)) {
        for (const h of history.slice(-10)) {
          messages.push({
            role: h.role === "user" ? "user" : "assistant",
            content: h.text
          });
        }
      }
      messages.push({ role: "user", content: message });

      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I was unable to analyze this crop request.";

      // groundingSources is empty — Groq does not have Google Search grounding
      const sources: any[] = [];

if (farmerId) {
  try {
    await saveFarmer(farmerId, {
      ...(farmerMemory || {}),
      farmerId,
      lastMessage: message,
      lastResponse: aiResponse,
      lastActive: new Date().toISOString()
    });
  } catch (err) {
    console.error("Memory save error:", err);
  }
}

res.json({
  text: aiResponse,
  groundingSources: sources
});

    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: error.message || "Internal Farm Engine error." });
    }
  });

  // API Route: Image Leaf Diagnosis — UNCHANGED, still uses Gemini
  app.post("/api/analyze-image", aiRateLimit, async (req, res) => {
    try {
      const { imageBase64, mimeType, cropTypePrompt } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image payload is required." });
      }

      // Strip potential visual prefixes
      const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const resolvedMime = mimeType || "image/jpeg";

  
     
      let client: GoogleGenAI;
      try {
        client = getGeminiClient();
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
          return res.status(503).json({
            error: "Image analysis is temporarily unavailable. Please try again later.",
            code: "IMAGE_AI_UNAVAILABLE"
          });
        }
        throw err;
      }

      const prompt = `You are CEN, the EnFarm crop disease specialist for Tanzania. Analyze this crop image.
Focus on crops common in Tanzania: maize, cassava, rice, sunflower, beans.
Identify the crop, diagnose any disease, pest damage, or nutrient deficiency.
All text fields in your response must be written in simple Swahili that an uneducated farmer can understand.
Use scientific names only in the crop field. Everything else must be in Swahili.
Provide your response exactly matching the JSON schema structure.`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            inlineData: {
              data: rawBase64,
              mimeType: resolvedMime
            }
          },
          {
            text: prompt + (cropTypePrompt ? ` (Note: User thinks this is a ${cropTypePrompt})` : "")
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: {
                type: Type.STRING,
                description: "Name of the crop identified, including formal botanical name in parentheses."
              },
              healthScore: {
                type: Type.INTEGER,
                description: "Estimated health score from 0 (dead/dying) to 100 (flawless health)."
              },
              riskLevel: {
                type: Type.STRING,
                description: "Disease risk classification: Low, Medium, or High."
              },
              diagnosis: {
                type: Type.STRING,
                description: "Botanical or pathology diagnosis (e.g., Healthy, Leaf Rust, Nitrogen deficiency, Septoria)."
              },
              severity: {
                type: Type.STRING,
                description: "Infection severity: None, Mild, Moderate, or Severe."
              },
              confidence: {
                type: Type.NUMBER,
                description: "Model confidence indicator between 0.0 and 1.0."
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "List of actionable, scientific farming recommendations for resolution or preventive care."
              },
              summary: {
                type: Type.STRING,
                description: "A professional, concise 1-sentence analytical overview summarizing this diagnosis."
              }
            },
            required: ["crop", "healthScore", "riskLevel", "diagnosis", "severity", "confidence", "recommendations", "summary"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from plant pathologist agent.");
      }

      const assessment = JSON.parse(responseText.trim());
      res.json(assessment);

    } catch (error: any) {
      console.error("Image Analysis API error:", error);
      res.status(500).json({ error: error.message || "Pathology engine failed." });
    }
  });

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
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image  = Buffer.from(imageBuffer).toString("base64");
        const mimeType     = imageResp.headers.get("content-type") || "image/jpeg";

        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            { inlineData: { data: base64Image, mimeType } },
            {
              text: `You are CEN, the EnFarm crop disease specialist for Tanzania. Analyze this crop image.
Focus on crops common in Tanzania: maize, cassava, rice, sunflower, beans.
Identify the crop, diagnose any disease, pest damage, or nutrient deficiency.
All text fields in your response must be written in simple Swahili that an uneducated farmer can understand.
Use scientific names only in the crop field. Everything else must be in Swahili.
Provide your response exactly matching the JSON schema structure.`,
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                crop: { type: Type.STRING },
                healthScore: { type: Type.INTEGER },
                riskLevel: { type: Type.STRING },
                diagnosis: { type: Type.STRING },
                severity: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              },
              required: ["crop", "healthScore", "riskLevel", "diagnosis", "severity", "confidence", "recommendations", "summary"]
            }
          }
        });

        let diagnosisRecord: any = null;
        try {
          diagnosisRecord = JSON.parse((response.text || "{}").trim());
        } catch {
          diagnosisRecord = null;
        }

        // Build a short farmer-facing Swahili reply from the structured data
        if (diagnosisRecord) {
          const steps = (diagnosisRecord.recommendations || []).slice(0, 3)
            .map((r: string, i: number) => `${i + 1}. ${r}`).join("\n");
          replyText = `*${diagnosisRecord.diagnosis}*\nZao: ${diagnosisRecord.crop}\nUkali: ${diagnosisRecord.severity}\n\n${steps}`;
        } else {
          replyText = "Samahani, sikuweza kuona picha vizuri. Tuma tena.";
        }

        // Save structured diagnosis + conversation log
        const updated = {
          ...(farmer || { farmerId, crops: [], diseases: [], conversations: [] }),
          farmerId,
          joinedAt: farmer?.joinedAt ?? new Date().toISOString(),
          diseases: [
            ...((farmer?.diseases || [])),
            ...(diagnosisRecord ? [
              {
  cropType: diagnosisRecord.crop ?? null,
  diagnosis: diagnosisRecord.diagnosis ?? null,
  severity: diagnosisRecord.severity ?? null,
  healthScore: diagnosisRecord.healthScore ?? null,
  confidence: diagnosisRecord.confidence ?? null,

  treatment: diagnosisRecord.recommendations || [],

  outcome: null,

  recoveryDays: null,

  timestamp: new Date().toISOString(),
}] : []),
          ],
          conversations: [
            ...((farmer?.conversations || []).slice(-9)),
            { role: "farmer", text: "[Alituma picha ya zao]", timestamp: new Date().toISOString() },
            { role: "cen",    text: replyText,                timestamp: new Date().toISOString() },
          ],
          lastActive: new Date().toISOString(),
        };
        try { await saveFarmer(farmerId, updated); } catch {}

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
    ...((farmer?.diseases || [])),
    ...(textDiagnosis ? [{
      cropType: textDiagnosis.cropType ?? null,
      diagnosis: textDiagnosis.diagnosis ?? null,
      severity: textDiagnosis.severity ?? null,
      healthScore: null,
      confidence: textDiagnosis.confidence ?? null,
      timestamp: new Date().toISOString(),
    }] : []),
  ],
      conversations: [
    ...((farmer?.conversations || []).slice(-9)),
    { role: "farmer", text: incomingMsg, timestamp: new Date().toISOString() },
    { role: "cen",    text: replyText,   timestamp: new Date().toISOString() },
  ],
  lastActive: new Date().toISOString(),
};
try { await saveFarmer(farmerId, updated); } catch (err) { console.error("Save failed for", farmerId, err); }

            // Send the real answer as a follow-up WhatsApp message
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken  = process.env.TWILIO_AUTH_TOKEN;
            const from       = process.env.TWILIO_WHATSAPP_NUMBER;
            if (accountSid && authToken && from) {
              const followUpClient = twilio(accountSid, authToken);
              await followUpClient.messages.create({
                from,
                to: farmerPhone,
                body: replyText,
              });
            }
          } catch (err) {
            console.error("Async WhatsApp text handling error:", err);
          }
        })();
        return; // already responded to Twilio above, stop here

      } else {
        replyText = "Habari! Mimi ni CEN wa EnFarm. Niambie tatizo lako la shamba au tuma picha ya zao lako.";
      }

      twiml.message(replyText);

    } catch (error) {
      console.error("WhatsApp error:", error);
      twiml.message("Samahani, kuna tatizo. Jaribu tena baadaye.");
    }

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  });

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
    pestControl: "Angalia mashamba yako asubuhi kwa dalili za viwavi au wadudu wengine.",
    irrigation: "Mwagilia mimea yako asubuhi na mapema — lita 2 kwa kila mmea.",
    fertilization: "Ongeza mbolea ya DAP wakati wa kupanda na urea baada ya wiki 4.",
    harvesting: "Vuna mahindi yako wakati maganda yanapokauka na kuwa ya kahawia."
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
