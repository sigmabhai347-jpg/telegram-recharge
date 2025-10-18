import { GoogleGenAI } from "@google/genai";

// Fix: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines.
// The API key is assumed to be pre-configured and available in the environment.
const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY
});
const model = 'gemini-2.5-flash';
export const generateStyledMessage = async (text, stylePrompt) => {
  // Fix: Separated prompt into systemInstruction and user-facing contents for clarity and adherence to best practices.
  // Fix: Replaced template literal with a regular string to avoid nesting issues.
  const systemInstruction = "You are an expert social media manager specializing in Telegram promotions. Your task is to reformat a given text into a specific style for a Telegram post.\n\n**Instructions:**\n1.  Adhere strictly to the requested style.\n2.  Keep all original links, information, and the overall meaning intact.\n3.  Structure the output clearly with headings, lists, and spacing for maximum readability on mobile devices.\n4.  Do not add any extra information or commentary that wasn't in the original text.\n5.  The output should be the formatted message itself, ready to be copied and pasted.";

  // Fix: Replaced template literal with string concatenation to fix parsing errors.
  const userPrompt = '**Style Request:**\n' + stylePrompt + '\n\n**Original Text to Format:**\n' + '---\n' + text + '\n---\n  ';
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating styled message:", error);
    if (error instanceof Error) {
      // Fix: Replaced template literal with string concatenation to fix parsing errors.
      return Promise.reject(new Error('Failed to generate message: ' + error.message));
    }
    return Promise.reject(new Error("An unknown error occurred while contacting the Gemini API."));
  }
};