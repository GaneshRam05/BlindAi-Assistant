const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== API ROUTE =====
app.post("/ask-ai", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const model = genAI.getGenerativeModel({
      model: "models/text-bison-001",
    });

    const result = await model.generateContent(message);
    res.json({ reply: result.response.text() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ===== SERVE FRONTEND =====
const frontendPath = path.join(__dirname, "dist");
app.use(express.static(frontendPath));

// React routing support
app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Blind AI Backend Running ✅");
});
