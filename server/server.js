const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in environment");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== API =====
app.post("/ask-ai", async (req, res) => {
  try {
    const { message, image } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    let result;

    if (image) {
      result = await model.generateContent([
        message,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: image.replace(/^data:image\/\w+;base64,/, ""),
          },
        },
      ]);
    } else {
      result = await model.generateContent(message);
    }

    res.json({ reply: result.response.text() });

  } catch (error) {
    console.error("🔥 AI ERROR:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});


// ===== SERVE FRONTEND =====
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Blind AI Backend Running on port", PORT);
});
