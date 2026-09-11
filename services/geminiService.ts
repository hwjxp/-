
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const validateCardAsset = async (cardData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As an AI quality assurance expert for an IP Trading Card company, validate the following card entry:
      - Chinese Name: ${cardData.title}
      - English Name: ${cardData.cardData?.nameEn || 'N/A'}
      - Card Code: ${cardData.cardData?.code}
      - Description: ${cardData.description}
      - Type: ${cardData.cardData?.cardTypeL2}

      Please check for:
      1. Translation accuracy (CN to EN).
      2. Spelling errors in both languages.
      3. Consistency (Does the name match the intended category?).
      4. Visual logic (Assume the image matches the description).

      Respond in JSON format with a status (SUCCESS or FAILED) and a list of specific error strings if any.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "SUCCESS or FAILED" },
            errors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of validation errors found"
            },
            summary: { type: Type.STRING, description: "Brief summary of the check" }
          },
          required: ["status", "errors"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return null;
  }
};

export const analyzeAsset = async (imageUrl: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI assistant for a creative asset gallery called Super Picool. 
          Given the description: "${description}", suggest 5 professional tags for this asset and a short, catchy SEO-optimized title. 
          Respond in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
