// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== Serve React Frontend =====
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// POST /ask-ai endpoint
app.post("/ask-ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required" });

    const model = genAI.getGenerativeModel({
      model: "models/text-bison-001", // Free tier model
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    const text = result.response.text();
    res.json({ reply: text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({
      error: error.message,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
  }
});

// For React Router: serve index.html on unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Log API key length for verification
console.log("KEY LENGTH:", process.env.GEMINI_API_KEY?.length);
