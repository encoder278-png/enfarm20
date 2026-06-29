import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";
import { getFarmer, saveFarmer } from "./src/memoryService";
import twilio from "twilio";

dotenv.config();

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

const GROQ_MODEL = "llama-3.3-70b-versatile";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  app.post("/api/chat", async (req, res) => {
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

      let client: OpenAI;
      try {
        client = getGroqClient();
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
          // Simulated Agriculture Expert responses as graceful fallback
          return res.json({
            text: "Live AI is temporarily unavailable. Please try again later.",
            groundingSources: []
          });
        }
        throw err;
      }

      // Convert history to format chat can understand
      const memoryContext = farmerMemory
  ? `
FARMER MEMORY:
${JSON.stringify(farmerMemory, null, 2)}
`
  : `
FARMER MEMORY:
No previous farmer data.
`;

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
  app.post("/api/analyze-image", async (req, res) => {
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
          // Generate realistic crop diagnosis fallback
          const sampleDiagnoses = [
  {
    crop: "Mahindi (Zea mays)",
    healthScore: 45,
    riskLevel: "High",
    diagnosis: "Fall Armyworm - Viwavi vya Jeshi",
    severity: "Severe",
    confidence: 0.88,
    recommendations: [
      "Nyunyizia dawa ya Lambda-cyhalothrin asubuhi na mapema kabla jua halijachomoza.",
      "Angalia mimea yako kila siku asubuhi kwa mayai ya viwavi chini ya majani.",
      "Kata na choma majani yaliyoathirika ili kuzuia kuenea.",
      "Panda aina ya mahindi inayostahimili wadudu msimu ujao."
    ],
    summary: "Mahindi yako yana shambulio kubwa la viwavi vya jeshi. Chukua hatua haraka leo."
  },
  {
    crop: "Muhogo (Manihot esculenta)",
    healthScore: 38,
    riskLevel: "High",
    diagnosis: "Cassava Mosaic Disease - Ugonjwa wa Mosaic wa Muhogo",
    severity: "Severe",
    confidence: 0.91,
    recommendations: [
      "Ng'oa mimea yote iliyoathirika na uichome mbali na shamba.",
      "Usitumie vipande vya muhogo mgonjwa kupanda.",
      "Panda aina ya muhogo inayostahimili ugonjwa kama UKIRIGURU.",
      "Angalia wadudu weupe wadogo kwenye majani — wao husambaza ugonjwa huu."
    ],
    summary: "Muhogo wako una ugonjwa mbaya wa mosaic. Lazima ung'oe mimea iliyoathirika haraka."
  },
  {
    crop: "Mahindi (Zea mays)",
    healthScore: 85,
    riskLevel: "Low",
    diagnosis: "Afya Nzuri - Upungufu Mdogo wa Nitrojeni",
    severity: "None",
    confidence: 0.93,
    recommendations: [
      "Weka mbolea ya urea kidogo — kilo 40 kwa ekari moja kabla mahindi hayajachanua.",
      "Endelea kumwagilia mara mbili kwa wiki.",
      "Shamba lako liko vizuri. Endelea kulilinda."
    ],
    summary: "Mahindi yako yana afya nzuri. Ongeza mbolea kidogo ili mavuno yawe bora zaidi."
  }
];

          // Pick crop based on prompt if specified, otherwise random
          let picked = sampleDiagnoses[Math.floor(Math.random() * sampleDiagnoses.length)];
          if (cropTypePrompt) {
            const match = sampleDiagnoses.find(d => d.crop.toLowerCase().includes(cropTypePrompt.toLowerCase()));
            if (match) picked = match;
          }

          return res.json({
            ...picked,
            summary: `[DEMO MODE] ${picked.summary}`
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
  app.post("/api/whatsapp", express.urlencoded({ extended: false }), async (req, res) => {
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

      if (numMedia > 0) {
        // Farmer sent a PHOTO — UNCHANGED, still uses Gemini
        const imageUrl = req.body.MediaUrl0;

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
          diseases: [
            ...((farmer?.diseases || [])),
            ...(diagnosisRecord ? [{
              cropType: diagnosisRecord.crop ?? null,
              diagnosis: diagnosisRecord.diagnosis ?? null,
              severity: diagnosisRecord.severity ?? null,
              healthScore: diagnosisRecord.healthScore ?? null,
              confidence: diagnosisRecord.confidence ?? null,
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

  const systemInstruction = `
${memoryContext}

Wewe ni CEN, msaidizi wa kilimo wa EnFarm kwa wakulima wadogo Tanzania.
SHERIA:
1. Jibu kwa Kiswahili rahisi daima.
2. Jibu swali moja kwa moja. Usiseme utangulizi mrefu.
3. Kama mkulima anaelezea tatizo, uliza swali MOJA au mwomba apige picha.
4. Majibu mafupi - mkulima anasoma kwenye simu ndogo.
5. Mwisho wa jibu lako, sema hatua moja rahisi mkulima afanye LEO.
6. Mazao: Mahindi, Muhogo, Mpunga, Alizeti, Maharage, Nyanya.
7. Kama unajua jina la mkulima, mwite kwa jina mara moja katika jibu lako.
8. USIULIZE tena jina au mkoa kama tayari unazo taarifa hizo hapo juu.
${shouldAskNow ? `
9. MUHIMU: Hatujui jina au mkoa wa mkulima huyu bado. Baada ya kujibu swali lake LEO, ongeza swali moja zaidi mwishoni: "Kabla tusonge mbele, jina lako ni nani na unakaa mkoa gani?" Usiulize hili kabla ya kujibu swali lake la msingi.
` : ''}
10. Kama mkulima anauliza kuhusu hali ya hewa: kama una taarifa za hali ya hewa hapo juu, zitumie kujibu kwa uhakika. Kama hakuna taarifa (hujui mkoa wake, au taarifa hazipo), sema kwa uwazi "Sina taarifa za hakika za hali ya hewa kwa eneo lako" — USIBUNI jibu kamwe.
11. MUHIMU - USIBAHATISHE KWA KUTAZAMA NENO MOJA: Kama mkulima ameeleza dalili KADHAA kwa wakati mmoja (mfano: majani ya njano + hakuna mvua + wadudu/viwavi), USITOE utambuzi MMOJA tu kwa uhakika. Badala yake:
   a) Taja UWEZEKANO WOTE muhimu yanayofaa dalili zote alizotaja, kila moja na asilimia ya uhakika tofauti.
   b) Panga kwa mpangilio wa uwezekano mkubwa kwenda mdogo.
   c) Kama mkulima ametaja wadudu, viwavi, au kitu chochote MAALUM alichokiona kwa macho yake (si kukisia), hilo ni dalili ya UHAKIKA ZAIDI kuliko utambuzi wa jumla kama "ukungu" au "ugonjwa" - usipuuze kile alichokiona moja kwa moja.
   d) Tofautisha: dalili alizoziona mkulima moja kwa moja (macho yake) ni za uhakika zaidi kuliko hitimisho la jumla unalolifanya wewe.
12. USIBUNI ASILIMIA YA UHAKIKA: Asilimia (confidence) unayotoa inapaswa kutegemea idadi na ubora wa dalili alizotaja mkulima - si muundo wa sentensi yako. Kama dalili hazitoshi kutoa uhakika mkubwa kwa chochote, SEMA WAZI "sina uhakika kamili, lakini uwezekano ni..." badala ya kutoa asilimia ya juu isiyo na msingi.
13. Mwishoni mwa utambuzi wa dalili nyingi, daima eleza hatua za HARAKA (saa 48 zijazo) kwa kila uwezekano mkubwa - usisubiri picha kabla ya kutoa mwongozo wa awali, hata kama bado unauliza picha kwa uthibitisho zaidi.
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
          temperature: 0.7,
        });

        replyText = completion.choices[0]?.message?.content || "Samahani, jaribu tena.";

        // Lightweight name/region extraction from farmer's NEXT message (not this one)
        // Run this check on the INCOMING message, in case farmer already answered last time we asked
        if (needsProfile) {
          const extraction = await groqClient.chat.completions.create({
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
          });
          try {
            const parsed = JSON.parse(
              (extraction.choices[0]?.message?.content || "{}").replace(/```json|```/g, "").trim()
            );
            if (parsed.name) farmer = { ...(farmer || {}), name: parsed.name };
            if (parsed.region) farmer = { ...(farmer || {}), region: parsed.region };
          } catch { /* ignore parse failures, don't block the reply */ }
        }

        // Save to Firestore — UNCHANGED
        const updated = {
  ...(farmer || { farmerId, crops: [], diseases: [], conversations: [] }),
  farmerId,
  name: farmer?.name ?? null,
  region: farmer?.region ?? null,
  profileAskedAt: (shouldAskNow ? new Date().toISOString() : farmer?.profileAskedAt) ?? null,
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
  app.post("/api/whatsapp-send", async (req, res) => {
    try {
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
  app.get("/api/recommendations", async (req, res) => {
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
