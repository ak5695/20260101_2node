import { streamText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { messages, mode = 'stream', context } = await request.json();
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;

    // 1. JSON Mode: 高精度知识卡片提取 (Promote to Node)
    if (mode === 'json') {
      const systemPrompt = `You are a knowledge distillation expert. 
Your goal is to create a "knowledge card" with MINIMUM information.
Rules for JSON fields:
- summaryQuestion: The distilled subject or core question (MAX 1 sentence/phrase). NO "What is..." or "How to...".
- summaryAnswer: The absolute essence. Use EITHER a single concise sentence, a formula, or a list of 3-5 keywords. 
- NO introductory filler, NO "Sure!", NO "Here is the summary".
- fullAnswer: Your detailed, high-fidelity explanation in Markdown.
- Respond ONLY with valid JSON: {"summaryQuestion": "...", "summaryAnswer": "...", "fullQuestion": "...", "fullAnswer": "..."}`;

      const result = await streamText({
        model: getLanguageModel("deepseek-chat"),
        system: systemPrompt + (context ? `\nContext: ${context}` : ""),
        messages: [{ role: 'user', content: question }],
      });
      return result.toTextStreamResponse();
    } 
    
    // 2. Stream Mode: 画布内流式探索
    else {
      const systemPrompt = `Provide a deep-dive technical answer. 
At the end, append the separator "__JSON_SUMMARY__" and a DISTILLED JSON object.
JSON Distillation Rules:
- summaryQuestion: The essence of the user's inquiry (Topic name).
- summaryAnswer: The core insight, formula, or key conclusion. MINIMUM text.
- NO polite noise or introductory filler inside the JSON.

Format:
[Detailed Markdown Answer]
__JSON_SUMMARY__
{"summaryQuestion": "...", "summaryAnswer": "..."}`;

      const result = await streamText({
        model: getLanguageModel("deepseek-chat"),
        system: systemPrompt + (context ? `\nContext: ${context}` : ""),
        messages: messages,
      });
      return result.toTextStreamResponse();
    }
  } catch (error) {
    console.error("Error in canvas chat API:", error);
    return new Response("Error", { status: 500 });
  }
}
