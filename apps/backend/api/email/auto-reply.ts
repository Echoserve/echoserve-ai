import { generateAIResponse, generateEmailTags } from '../../services/openaiService';
import { supabase } from '../../services/supabaseClient';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { from, subject, body, customerEmail } = await req.json();
    if (!from || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt =
      'You are an AI support assistant replying to the following customer email with a helpful, polite, and relevant response. Keep it concise.';
    const messages = [
      { role: 'user' as const, text: `${systemPrompt}\n\nSubject: ${subject}\nFrom: ${from}\n\n${body}` },
    ];

    // Pass empty strings for shopUrl and accessToken
    const reply = await generateAIResponse(messages, '', '', customerEmail);

    // Generate tags using OpenAI
    let tags: string[] = [];
    try {
      tags = await generateEmailTags(subject, body);
    } catch (err) {
      tags = [];
    }

    // Store email, reply, and tags in Supabase
    try {
      await supabase.from('email_messages').insert([
        {
          from,
          subject,
          body,
          ai_reply: reply,
          customer_email: customerEmail || null,
          tags,
        },
      ]);
    } catch (err) {
      // Log but do not block reply
      console.error('Failed to store email interaction:', err);
    }

    return new Response(
      JSON.stringify({ reply, tags }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 