const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== GEMINI SETUP =====
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in environment");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== API ROUTE =====
app.post("/ask-ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });

  } catch (error) {
    console.error("🔥 AI ERROR:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// ===== SERVE FRONTEND (VITE BUILD) =====
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

// ✅ Express 5 SAFE FALLBACK (NO WILDCARDS)
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ===== START SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Blind AI Backend Running on port", PORT);
});
