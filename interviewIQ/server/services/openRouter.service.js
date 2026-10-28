import axios from "axios";

export const askAi = async (messages) => {
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages array is empty.");
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error("Invalid response from AI");
    }
    return content.trim();
  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to communicate with AI");
  }
};