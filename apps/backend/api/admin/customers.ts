import { supabase } from '../../services/supabaseClient';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (req.method === 'GET' && email) {
    // 1. Fetch all email_messages for this customer
    const { data: emailMessages } = await supabase
      .from('email_messages')
      .select('body, ai_reply, created_at, role, customer_email')
      .eq('customer_email', email);

    // 2. Fetch all tickets for this customer to get session_ids
    const { data: tickets } = await supabase
      .from('tickets')
      .select('session_id')
      .eq('customer_email', email);
    const sessionIds = (tickets || []).map(t => t.session_id);

    // 3. Fetch all chat_messages for these session_ids
    let chatMessages: any[] = [];
    if (sessionIds.length > 0) {
      const { data } = await supabase
        .from('chat_messages')
        .select('message, created_at, role, session_id')
        .in('session_id', sessionIds);
      chatMessages = data || [];
    }

    // 4. Normalize email_messages
    const normalizedEmails: any[] = [];
    (emailMessages || []).forEach((msg: any) => {
      if (msg.body) {
        normalizedEmails.push({
          content: msg.body,
          created_at: msg.created_at,
          role: 'user',
          channel: 'email',
        });
      }
      if (msg.ai_reply) {
        normalizedEmails.push({
          content: msg.ai_reply,
          created_at: msg.created_at, // Use same timestamp for reply
          role: 'ai',
          channel: 'email',
        });
      }
    });

    // 5. Normalize chat_messages
    const normalizedChats = (chatMessages || []).map((msg: any) => ({
      content: msg.message,
      created_at: msg.created_at,
      role: msg.role === 'bot' ? 'ai' : msg.role, // normalize 'bot' to 'ai'
      channel: 'chat',
    }));

    // 6. Merge and sort
    const timeline = [...normalizedEmails, ...normalizedChats].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return new Response(JSON.stringify({ timeline }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'GET') {
    // Get unique emails from email_messages
    const { data: emailRows } = await supabase.from('email_messages').select('customer_email, created_at');
    // Get unique emails from tickets (chat)
    const { data: ticketRows } = await supabase.from('tickets').select('customer_email, created_at');
    // Combine and dedupe
    const all = [...(emailRows || []), ...(ticketRows || [])].filter(r => r.customer_email);
    const byEmail: Record<string, { email: string; totalMessages: number; lastMessageDate: string } > = {};
    all.forEach(row => {
      const email = row.customer_email;
      if (!byEmail[email]) {
        byEmail[email] = { email, totalMessages: 0, lastMessageDate: row.created_at };
      }
      byEmail[email].totalMessages += 1;
      if (!byEmail[email].lastMessageDate || (row.created_at && row.created_at > byEmail[email].lastMessageDate)) {
        byEmail[email].lastMessageDate = row.created_at;
      }
    });
    const customers = Object.values(byEmail).sort((a, b) => (b.lastMessageDate || '').localeCompare(a.lastMessageDate || ''));
    return new Response(JSON.stringify({ customers }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
} 