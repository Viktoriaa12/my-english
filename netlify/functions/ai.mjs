
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://viktoriaa12.github.io",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    const apiKey = Netlify.env.get("GROQ_API_KEY");

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const prompt = type === "word"
      ? `You are an English-Ukrainian dictionary.
For the English word "${text}", return:
Ukrainian translation, IPA transcription,
two natural English example sentences and
their Ukrainian translations.
Return ONLY valid JSON with keys:
translation, ipa, example, exampleTranslation.`
      : `Translate the English phrase "${text}" into natural Ukrainian.
Return ONLY valid JSON with key: translation.`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 512,
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(20000)
      }
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Groq API error ${response.status}: ${details}`);
    }

    const result = await response.json();
    const output = result.choices?.[0]?.message?.content;

    if (!output) {
      throw new Error("Groq returned an empty response");
    }

    const data = JSON.parse(output);

    return Response.json(data, { headers: corsHeaders });

  } catch (error) {
    console.error("AI function error:", error);

    return Response.json(
      { error: "Не вдалося отримати відповідь від ШІ. Спробуй ще раз." },
      { status: 500, headers: corsHeaders }
    );
  }
};
