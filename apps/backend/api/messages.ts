import { supabase } from '../services/supabaseClient';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { session_id, role, message } = body;
      if (!session_id || !role || !message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const { error } = await supabase.from('chat_messages').insert([
        { session_id, role, message },
      ]);
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: e.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id');
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ messages: data }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(
    JSON.stringify({ error: 'Method Not Allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
} 