
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://viktoriaa12.github.io",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export default async (request) => {
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

    if (
      !["word", "phrase"].includes(type) ||
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 200
    ) {
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

    const deadline = Date.now() + 18000;
    let response;

    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = deadline - Date.now();

      if (remaining <= 1000) {
        throw new Error("Gemini request timed out");
      }

      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            model: "gemini-3.8-flash",
            input: prompt,
            generation_config: {
              thinking_level: "low",
              max_output_tokens: 512
            }
          }),
          signal: AbortSignal.timeout(remaining)
        }
      );

      if (response.ok) break;

      const errorBody = await response.text();

      console.error(
        `Gemini attempt ${attempt + 1}:`,
        response.status,
        errorBody.slice(0, 500)
      );

      if (
        attempt === 0 &&
        [503, 504].includes(response.status) &&
        Date.now() < deadline - 2000
      ) {
        continue;
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    if (!response || !response.ok) {
      throw new Error("Gemini did not return a successful response");
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
      {
        error: "Не вдалося отримати відповідь від ШІ. Спробуй ще раз."
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};
