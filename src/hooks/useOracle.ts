import { useState, useCallback, useRef } from "react";
import type { Language } from "./useTranslation";

interface OracleRequest {
  cards: { name: string; meaning: string; position: string }[];
  question: string;
  language: Language;
}

interface OracleState {
  text: string;
  isStreaming: boolean;
  error: string | null;
}

const SYSTEM_PROMPT = `You are The Oracle — an ancient, compassionate witness to fate. You do not predict the future with certainty; you illuminate the present moment.

Speak in first person as The Oracle. Your voice is poetic but not obscure, warm but not sycophantic, honest without cruelty.

Guidelines:
- Begin with an atmospheric opening that acknowledges the seeker's energy
- Address each card (past/present/future) in sequence, 2-3 sentences each
- Weave the three cards into a unified narrative
- End with one clear, actionable insight
- Total length: 180-250 words
- If user provided a question/concern, make the reading specific to it
- Never say "as an AI" or break character
- Language: match the user's language (Chinese or English)`;

function buildUserMessage(req: OracleRequest): string {
  const cardLines = req.cards
    .map((c) => `- ${c.position}: ${c.name} (${c.meaning})`)
    .join("\n");
  return `Cards drawn:\n${cardLines}\n\nUser's question/concern: ${req.question || "general guidance"}\nLanguage: ${req.language}`;
}

async function streamClaude(
  req: OracleRequest,
  onChunk: (text: string) => void,
  abortSignal: AbortSignal
): Promise<void> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) throw new Error("VITE_CLAUDE_API_KEY not set in .env.local");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildUserMessage(req) }],
      stream: true,
    }),
    signal: abortSignal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const event = JSON.parse(data);
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
          ) {
            onChunk(event.delta.text);
          }
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }
}

async function streamGemini(
  req: OracleRequest,
  onChunk: (text: string) => void,
  abortSignal: AbortSignal
): Promise<void> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not set in .env.local");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContentStream({
    model: "gemini-2.0-flash",
    config: { systemInstruction: SYSTEM_PROMPT },
    contents: [{ role: "user", parts: [{ text: buildUserMessage(req) }] }],
  });

  for await (const chunk of response) {
    if (abortSignal.aborted) break;
    const text = chunk.text;
    if (text) onChunk(text);
  }
}

export function useOracle() {
  const [state, setState] = useState<OracleState>({
    text: "",
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const startReading = useCallback(async (req: OracleRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ text: "", isStreaming: true, error: null });

    const provider = import.meta.env.VITE_AI_PROVIDER || "claude";
    const streamFn = provider === "gemini" ? streamGemini : streamClaude;

    try {
      let accumulated = "";
      await streamFn(
        req,
        (chunk) => {
          accumulated += chunk;
          setState((prev) => ({
            ...prev,
            text: accumulated,
          }));
        },
        controller.signal
      );
      setState((prev) => ({ ...prev, isStreaming: false }));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err.message,
        }));
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return { ...state, startReading, cancel };
}
