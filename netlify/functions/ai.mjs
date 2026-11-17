
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://viktoriaa12.github.io",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export default async (request) => {
  // Дозволяємо браузеру виконати попередню перевірку
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { type, text } = await request.json();

    if (!["word", "phrase"].includes(type) ||
        typeof text !== "string" ||
        !text.trim() ||
        text.length > 200) {
      return Response.json(
        { error: "Некоректний запит" },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = Netlify.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("API key is not configured");
    }

    const prompt = type === "word"
      ? `You are an English-Ukrainian dictionary.
         For the English word "${text}", return:
         Ukrainian translation, IPA transcription,
         two natural English example sentences and
         their Ukrainian translations.
         Return ONLY valid JSON with keys:
         translation, ipa, example, exampleTranslation.`
      : `Translate the English phrase "${text}" into natural
         Ukrainian. Return ONLY valid JSON with key:
         translation.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: prompt
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();

    const output = (result.steps || [])
      .filter(step => step.type === "model_output")
      .flatMap(step => step.content || [])
      .filter(part => part.type === "text")
      .map(part => part.text)
      .join("");

    const clean = output
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const data = JSON.parse(clean);

    return Response.json(data, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error("AI function error:", error);

    return Response.json(
      { error: "Не вдалося отримати відповідь від ШІ. Спробуй ще раз." },
      { status: 500, headers: corsHeaders }
    );
  }
};
