import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Assistant endpoint for hashtag suggestion and drafting
  app.post("/api/gemini-assist", async (req, res) => {
    try {
      const { prompt, type, category } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;

      // Smart rule-based generator for fallback
      const generateSmartFallback = () => {
        const cat = String(category || "campus").toLowerCase();
        let fallbackHashtags = ["campusbuzz", "nitraipur"];
        let fallbackTitle = "";
        let fallbackSummary = "";

        if (cat.includes("food")) {
          fallbackHashtags = ["foodsplit", "nitrr_mess", "nightcanteen", "hostelH"];
          fallbackTitle = "Night Canteen / Swiggy Delivery Split to Hostel";
          fallbackSummary = "Ordering food right now! Looking for 2-3 campus mates to share delivery fee and minimum order discount.";
        } else if (cat.includes("cab")) {
          fallbackHashtags = ["cabsplit", "raipur_junction", "airport_rpr", "nitrr_cabs"];
          fallbackTitle = "Cab Share to Raipur Railway Station / Airport";
          fallbackSummary = "Booking an Ola/Uber cab this weekend. Have 2 open seats available to split fare equally.";
        } else if (cat.includes("resell")) {
          fallbackHashtags = ["resell", "campusdeals", "nitrr_seniors", "books_stationery"];
          fallbackTitle = "Engineering Books & Study Materials in Good Condition";
          fallbackSummary = "Selling well-maintained semester notes and reference textbooks at a student-friendly discounted price.";
        } else if (cat.includes("lost") || cat.includes("found")) {
          fallbackHashtags = ["lostandfound", "nitrr_campus", "central_library", "amul_parlour"];
          fallbackTitle = "Important Campus Item Report at Central Library";
          fallbackSummary = "Item spotted/lost near main corridor. Please reach out with proof of ownership or contact directly.";
        } else {
          fallbackHashtags = ["campusbuzz", "nitrr", "studenthub"];
          fallbackTitle = "NIT Raipur Campus Coordination Notice";
          fallbackSummary = "Active student coordination request for NIT Raipur campus community.";
        }

        return {
          suggestedTitle: prompt ? `NITRR: ${String(prompt).slice(0, 45).replace(/\n/g, ' ')}` : fallbackTitle,
          summary: fallbackSummary,
          hashtags: fallbackHashtags
        };
      };

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.log("GEMINI_API_KEY not configured, using smart coordination generator.");
        return res.json({ success: true, data: generateSmartFallback() });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are an AI assistant for Campus Buzz, a verified student coordination app at NIT Raipur (National Institute of Technology Raipur).
Analyze the student's draft post and output a JSON response with:
1. "suggestedTitle": a concise, catchy, high-impact post title (max 50 chars).
2. "summary": a polished 1-2 sentence description detailing timing, split details, or pickup points clearly.
3. "hashtags": an array of 2-4 clean hashtags without '#' symbols (e.g., ["foodsplit", "hostelD", "nitrr"]).
Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt || "Help organize a cab share or food order split on campus",
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const rawText = response.text || "{}";
      // Strip potential code fencing
      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn("JSON parse fallback for Gemini response:", parseErr);
        parsedData = generateSmartFallback();
      }

      return res.json({
        success: true,
        data: {
          suggestedTitle: parsedData.suggestedTitle || parsedData.title || undefined,
          summary: parsedData.summary || parsedData.enhancedDescription || parsedData.description || undefined,
          hashtags: Array.isArray(parsedData.hashtags) ? parsedData.hashtags : ["foodsplit", "campuslife"]
        }
      });
    } catch (err: any) {
      console.error("AI Generation Error in /api/gemini-assist:", err);
      // Fail gracefully so user flow is never broken
      return res.json({
        success: true,
        data: {
          suggestedTitle: "Campus Coordination Request",
          summary: "Looking for campus peers to coordinate on this request. Join group room or reach out!",
          hashtags: ["campusbuzz", "nitrr"]
        },
        notice: "Generated with local fallback due to API response."
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Campus Buzz server running on http://localhost:${PORT}`);
  });
}

startServer();
