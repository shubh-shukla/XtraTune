import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type ZodSchema } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

const client = new GoogleGenerativeAI(apiKey);
const MODEL = "gemini-1.5-flash";

const stripFences = (s: string) =>
  s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

export async function generateJSON<T>(prompt: string, schema: ZodSchema<T>): Promise<T> {
  const model = client.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  const raw = stripFences(result.response.text());
  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}

export async function generateText(prompt: string): Promise<string> {
  const model = client.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
