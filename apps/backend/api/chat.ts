import { generateAIResponse } from "../services/openaiService";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const messages = body.messages;
    const aiReply = await generateAIResponse(messages);
    return new Response(
      JSON.stringify({ reply: aiReply }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to generate AI response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
