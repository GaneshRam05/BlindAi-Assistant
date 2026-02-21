// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: __dirname + "/.env" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /ask-ai endpoint
app.post("/ask-ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use free tier model (text-bison-001)
    const model = genAI.getGenerativeModel({
      model: "models/text-bison-001", // ✅ free tier
    });

    // Proper request format for generateContent
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    // Extract text
    const text = result.response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("Gemini Error:", error);

    // Send full error info to client for easier debugging
    res.status(500).json({
      error: error.message,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Log API key length for verification
console.log("KEY LENGTH:", process.env.GEMINI_API_KEY?.length);
