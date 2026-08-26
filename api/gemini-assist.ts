import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // CORS handling
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { prompt, type } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        data: {
          suggestedTitle: prompt ? `Campus: ${String(prompt).slice(0, 30)}` : "Campus Activity",
          summary: "Campus coordination assistant ready. (Configure GEMINI_API_KEY in Vercel settings for full AI generation)",
          hashtags: ["foodsplit", "cabsplit", "resell", "campusbuzz"]
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

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
    } catch {
      data = { text: responseText };
    }

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate AI suggestions" });
  }
}
