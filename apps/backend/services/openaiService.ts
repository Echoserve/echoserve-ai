import { fetchLiveShopifyContext } from "./shopifyService";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateAIResponse(
  messages: { role: "user" | "bot"; text: string }[],
  shopUrl: string,
  accessToken: string,
  customerEmail: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  // Get live Shopify customer context
  const customerContext = await fetchLiveShopifyContext(shopUrl, accessToken, customerEmail);

  // Build system prompt with injected context
  const SYSTEM_PROMPT =
    `Available customer data: ${typeof customerContext === 'string' ? customerContext : JSON.stringify(customerContext)}\n` +
    "You are EchoServe, an autonomous support agent. Answer customer questions clearly, escalate if needed using: [create_ticket]. Use order info when appropriate.";

  // Map messages to OpenAI format
  const openaiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: openaiMessages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
}

export async function generateSummaryAndTags(messages: { role: string; message: string }[]) {
  const prompt = `\nYou are an assistant helping summarize customer support chats.\nReturn:\n- a 1-sentence summary of the issue\n- 3-5 relevant tags (like \"refund\", \"late delivery\", \"app crash\")\n\nFormat:\n{\n  \"summary\": \"...\",\n  \"tags\": [\"...\", \"...\"]\n}\n\nChat History:\n${messages.map(m => `${m.role.toUpperCase()}: ${m.message}`).join('\n')}\n`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You return JSON summaries from chat transcripts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const completion = await res.json();
  const jsonMatch = completion.choices?.[0]?.message?.content?.match(/{[\s\S]+}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: '', tags: [] };

  return parsed;
}

export async function generateEmailTags(subject: string, body: string): Promise<string[]> {
  const prompt = `Generate 2–3 concise support tags for this email: [${subject}] [${body}]. Return them as an array of lowercase strings.`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You return only a JSON array of lowercase tags for support emails.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });
  const completion = await res.json();
  const jsonMatch = completion.choices?.[0]?.message?.content?.match(/\[.*\]/s);
  let tags: string[] = [];
  if (jsonMatch) {
    try {
      tags = JSON.parse(jsonMatch[0]);
    } catch (e) {
      tags = [];
    }
  }
  return tags;
}
