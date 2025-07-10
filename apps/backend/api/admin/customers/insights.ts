import { supabase } from '../../../services/supabaseClient';

export const config = { runtime: 'edge' };

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const systemPrompt = `\nYou are an AI summarizer for a customer support platform. Given a chronological transcript of customer support messages across chat and email, extract:\n\n1. A short summary of the conversation.\n2. The customer's main intents (up to 3 short tags).\n3. The overall sentiment (Positive, Neutral, or Negative).\n\nRespond in JSON with the following format:\n{\n  "summary": "...",\n  "intents": ["...", "..."],\n  "sentiment": "Neutral"\n}\n`;

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Fetch all email_messages for this customer
  const { data: emailMessages } = await supabase
    .from('email_messages')
    .select('body, ai_reply, created_at, customer_email')
    .eq('customer_email', email);

  // Fetch all tickets for this customer to get session_ids
  const { data: tickets } = await supabase
    .from('tickets')
    .select('session_id')
    .eq('customer_email', email);
  const sessionIds = (tickets || []).map(t => t.session_id);

  // Fetch all chat_messages for these session_ids
  let chatMessages: any[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from('chat_messages')
      .select('message, created_at, role, session_id')
      .in('session_id', sessionIds);
    chatMessages = data || [];
  }

  // Normalize and merge all messages
  const normalized: { role: string; message: string; created_at: string }[] = [];
  (emailMessages || []).forEach((msg: any) => {
    if (msg.body) normalized.push({ role: 'user', message: msg.body, created_at: msg.created_at });
    if (msg.ai_reply) normalized.push({ role: 'ai', message: msg.ai_reply, created_at: msg.created_at });
  });
  (chatMessages || []).forEach((msg: any) => {
    normalized.push({ role: msg.role === 'bot' ? 'ai' : msg.role, message: msg.message, created_at: msg.created_at });
  });
  normalized.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Limit to last 40 messages for prompt size
  const messagesForPrompt = normalized.slice(-40);
  const userPrompt = messagesForPrompt.map(m => `[${m.role}] ${m.message}`).join("\n");

  // Call OpenAI
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing OpenAI API key' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });
  if (!openaiRes.ok) {
    return new Response(JSON.stringify({ error: 'OpenAI error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const openaiData = await openaiRes.json();
  const content = openaiData.choices?.[0]?.message?.content || '';
  let summary = '', intents: string[] = [], sentiment = '';
  try {
    const json = JSON.parse(content.match(/{[\s\S]+}/)?.[0] || '{}');
    summary = json.summary || '';
    intents = json.intents || [];
    sentiment = json.sentiment || '';
  } catch {
    summary = content;
    intents = [];
    sentiment = '';
  }
  return new Response(JSON.stringify({ summary, intents, sentiment }), { headers: { 'Content-Type': 'application/json' } });
} 