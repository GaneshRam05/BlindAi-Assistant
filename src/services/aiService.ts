const API_URL = "https://blind-ai-backend.onrender.com/ask-ai";

export const askAI = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/ask-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("AI request failed");
    }

    const data = await response.json();

    return data.reply || "No response from AI.";

  } catch (error) {
    console.error("AI Service Error:", error);
    return "Sorry, I cannot connect to AI right now.";
  }
};
