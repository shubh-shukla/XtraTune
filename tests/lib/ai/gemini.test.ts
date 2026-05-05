import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@google/generative-ai", () => {
  const generateContent = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn(function () {
      return {
        getGenerativeModel: () => ({ generateContent }),
      };
    }),
    __mock: { generateContent },
  };
});

import { generateJSON } from "@/lib/ai/gemini";
import { z } from "zod";

const mod: any = await import("@google/generative-ai");

describe("generateJSON", () => {
  beforeEach(() => mod.__mock.generateContent.mockReset());

  it("parses valid JSON output against schema", async () => {
    mod.__mock.generateContent.mockResolvedValue({
      response: { text: () => '{"value":42}' },
    });
    const schema = z.object({ value: z.number() });
    const out = await generateJSON("p", schema);
    expect(out).toEqual({ value: 42 });
  });

  it("strips markdown fences before parsing", async () => {
    mod.__mock.generateContent.mockResolvedValue({
      response: { text: () => '```json\n{"value":7}\n```' },
    });
    const schema = z.object({ value: z.number() });
    expect(await generateJSON("p", schema)).toEqual({ value: 7 });
  });

  it("throws on invalid JSON", async () => {
    mod.__mock.generateContent.mockResolvedValue({
      response: { text: () => "not json" },
    });
    await expect(generateJSON("p", z.object({}))).rejects.toThrow();
  });
});
