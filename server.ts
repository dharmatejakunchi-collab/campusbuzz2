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
      const { prompt, type } = req.body;
      const ai = getAI();
      if (!ai) {
        return res.status(200).json({
          suggestion: "Campus coordination assistant ready. (Add GEMINI_API_KEY for advanced generation)",
          hashtags: ["foodsplit", "campuslife"]
        });
      }

      let systemInstruction = "";
      if (type === "hashtags") {
        systemInstruction = `You are a campus assistant for a university coordination app called Campus Buzz. The primary hashtags are #foodsplit, #cabsplit, #resell, #lost, #found. Analyze the user's post title and text and return 1-4 relevant hashtags and a 1-sentence catchy description or tip. Return valid JSON: {"hashtags": string[], "suggestedTitle": string, "summary": string}`;
      } else {
        systemInstruction = `You are a campus assistant helping a student write a clear, concise campus coordination post. Format nicely. Return valid JSON: {"enhancedDescription": string, "suggestedHashtag": string, "tips": string[]}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt || "Help split food delivery from McDonald's with 3 people in Hall 4",
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      let data = {};
      try {
        data = JSON.parse(responseText || "{}");
      } catch (e) {
        data = { text: responseText };
      }

      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate AI suggestions" });
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
