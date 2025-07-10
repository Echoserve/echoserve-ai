import { supabase } from '../../services/supabaseClient';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('agents').select('id, name');
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ agents: data }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
} 