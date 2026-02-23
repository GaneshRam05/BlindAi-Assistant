const API_URL = "https://blind-ai-backend.onrender.com";

export const askAI = async (
  prompt: string,
  imageBase64?: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/ask-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        image: imageBase64 || null,
      }),
    });

    if (!response.ok) {
      throw new Error("AI request failed");
    }

    const data = await response.json();
    return data.reply || "No response from AI.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I cannot analyze the environment right now.";
  }
};
