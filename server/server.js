const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== API =====
app.post("/ask-ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// ===== SERVE FRONTEND =====
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Blind AI Backend Running ✅"));
