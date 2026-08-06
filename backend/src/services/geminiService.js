import "dotenv/config";

import {
  GoogleGenAI,
} from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "A variável GEMINI_API_KEY não foi definida.",
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateLiterarySummary(
  originalText,
) {
  const response =
    await ai.models.generateContent({
      model:
        process.env.GEMINI_MODEL ||
        "gemini-3-flash-preview",

      contents: [
        {
          role: "user",

          parts: [
            {
              text: `
Resuma o trecho literário abaixo usando uma linguagem clara,
atual e acessível, sem perder o sentido original.

Preserve os personagens, acontecimentos e ideias principais.
Evite acrescentar informações que não estejam no texto.
Organize o resumo em parágrafos bem conectados.

Trecho:

${originalText}
              `.trim(),
            },
          ],
        },
      ],
    });

  const summary =
    typeof response.text === "string"
      ? response.text.trim()
      : "";

  if (!summary) {
    throw new Error(
      "A inteligência artificial não retornou um resumo.",
    );
  }

  return summary;
}