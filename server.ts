import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getFarmer, saveFarmer } from "./src/memoryService";
import twilio from "twilio";

dotenv.config();

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not configured or holds a placeholder. Falling back to simulated AI intelligence.");
      throw new Error("API_KEY_MISSING");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    const activeKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    res.json({
      status: "ok",
      platform: "EnFarm Crop Intelligence Server",
      geminiConfigured: activeKey,
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

      let client: GoogleGenAI;
      try {
        client = getGeminiClient();
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
       


      // We'll use chat format or standard generateContent with history as context
      const chatContext = history ? history.map((h: any) => `${h.role === 'user' ? 'Farmer' : 'EnFarm AI'}: ${h.text}`).join("\n") + `\nFarmer: ${message}\nEnFarm AI:` : message;

      const response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: chatContext,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || "Search Reference",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri);

      const aiResponse = response.text || "I was unable to analyze this crop request.";

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

  // API Route: Image Leaf Diagnosis
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
        model: "gemini-1.5-flash",
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
        // Farmer sent a PHOTO
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
          model: "gemini-1.5-flash",
          contents: [
            { inlineData: { data: base64Image, mimeType } },
            {
              text: `Wewe ni daktari wa mimea wa EnFarm Tanzania.
Chunguza picha hii ya zao. Jibu kwa Kiswahili rahisi fupi.
Sema: (1) Zao gani (2) Tatizo gani (3) Hatua 3 za kutibu.
Jibu fupi sana - mkulima anasoma kwenye simu ndogo ya WhatsApp.`,
            },
          ],
        });

        replyText = response.text || "Samahani, sikuweza kuona picha vizuri. Tuma tena.";

        // Save to Firestore
        const updated = {
          ...(farmer || { farmerId, crops: [], diseases: [], conversations: [] }),
          farmerId,
          conversations: [
            ...((farmer?.conversations || []).slice(-9)),
            { role: "farmer", text: "[Alituma picha ya zao]", timestamp: new Date().toISOString() },
            { role: "cen",    text: replyText,                timestamp: new Date().toISOString() },
          ],
          lastActive: new Date().toISOString(),
        };
        try { await saveFarmer(farmerId, updated); } catch {}

      } else if (incomingMsg) {
        // Farmer sent TEXT
        const client = getGeminiClient();

        const recentHistory = (farmer?.conversations || []).slice(-10);
        const contents = [
          ...recentHistory.map((h: any) => ({
            role: h.role === "farmer" ? "user" : "model",
            parts: [{ text: h.text }],
          })),
          { role: "user", parts: [{ text: incomingMsg }] },
        ];

        const systemInstruction = `
Wewe ni CEN, msaidizi wa kilimo wa EnFarm kwa wakulima wadogo Tanzania.
SHERIA:
1. Jibu kwa Kiswahili rahisi daima.
2. Jibu swali moja kwa moja. Usiseme utangulizi mrefu.
3. Kama mkulima anaelezea tatizo, uliza swali MOJA au mwomba apige picha.
4. Majibu mafupi - mkulima anasoma kwenye simu ndogo.
5. Mwisho wa jibu lako, sema hatua moja rahisi mkulima afanye LEO.
6. Mazao: Mahindi, Muhogo, Mpunga, Alizeti, Maharage, Nyanya.
`;

        const response = await client.models.generateContent({
          model:"gemini-1.5-flash",
          contents,
          config: { systemInstruction },
        });

        replyText = response.text || "Samahani, jaribu tena.";

        // Save to Firestore
        const updated = {
          ...(farmer || { farmerId, crops: [], diseases: [], conversations: [] }),
          farmerId,
          conversations: [
            ...((farmer?.conversations || []).slice(-9)),
            { role: "farmer", text: incomingMsg, timestamp: new Date().toISOString() },
            { role: "cen",    text: replyText,   timestamp: new Date().toISOString() },
          ],
          lastActive: new Date().toISOString(),
        };
        try { await saveFarmer(farmerId, updated); } catch {}

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
  // Manual reply from admin to farmer via WhatsApp
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

  // API Route: AI recommendations categories
  app.get("/api/recommendations", async (req, res) => {
  try {
    let client: GoogleGenAI;
    try {
      client = getGeminiClient();
    } catch {
      return res.json({
        pestControl: "Angalia mashamba yako asubuhi kwa dalili za viwavi au wadudu wengine.",
        irrigation: "Mwagilia mimea yako asubuhi na mapema — lita 2 kwa kila mmea.",
        fertilization: "Ongeza mbolea ya DAP wakati wa kupanda na urea baada ya wiki 4.",
        harvesting: "Vuna mahindi yako wakati maganda yanapokauka na kuwa ya kahawia."
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Wewe ni mshauri wa kilimo wa Tanzania. Toa ushauri mfupi wa kilimo kwa Kiswahili kwa maeneo manne: Udhibiti wa Wadudu, Umwagiliaji, Mbolea, na Uvunaji. Kila ushauri uwe sentensi moja fupi.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pestControl: { type: Type.STRING },
            irrigation: { type: Type.STRING },
            fertilization: { type: Type.STRING },
            harvesting: { type: Type.STRING }
          },
          required: ["pestControl", "irrigation", "fertilization", "harvesting"]
        }
      }
    });

    const responseText = response.text || "";
    if (!responseText) {
      throw new Error("Empty response received from recommendations agent.");
    }

    res.json(JSON.parse(responseText.trim()));
  } catch (e) {
    res.json({
      pestControl: "Angalia mashamba yako asubuhi kwa dalili za viwavi au wadudu wengine.",
      irrigation: "Mwagilia mimea yako asubuhi na mapema — lita 2 kwa kila mmea.",
      fertilization: "Ongeza mbolea ya DAP wakati wa kupanda na urea baada ya wiki 4.",
      harvesting: "Vuna mahindi yako wakati maganda yanapokauka na kuwa ya kahawia."
    });
  }
});

  // Vite middleware for development
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
