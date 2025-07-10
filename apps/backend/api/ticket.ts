import { supabase } from '../services/supabaseClient';
import { generateSummaryAndTags } from '../services/openaiService';

export const config = { runtime: 'edge' };

export async function POST(req: Request) {
  try {
    const { userMessage, aiResponse, session_id } = await req.json();

    if (!userMessage || !aiResponse || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Step 1: Insert ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([{ user_message: userMessage, ai_response: aiResponse, session_id, status: 'open' }])
      .select()
      .single();

    if (error) throw error;

    // Step 2: Fetch all messages for this session
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, message')
      .eq('session_id', session_id)
      .order('created_at');

    // Step 3: Generate summary & tags from OpenAI
    const { summary, tags } = await generateSummaryAndTags(messages || []);

    // Step 4: Update ticket with summary and tags
    await supabase.from('tickets').update({ summary, tags }).eq('id', ticket.id);

    // Step 5: Auto-assign agent based on tags
    let assignedAgentName = null;
    if (tags && tags.length > 0) {
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .contains('tags', tags)
        .eq('online', true)
        .order('current_load', { ascending: true })
        .limit(1);
      if (agents && agents.length > 0) {
        const agent = agents[0];
        await supabase
          .from('tickets')
          .update({ assigned_to: agent.id })
          .eq('id', ticket.id);
        await supabase
          .from('agents')
          .update({ current_load: agent.current_load + 1 })
          .eq('id', agent.id);
        assignedAgentName = agent.name;
      }
    }

    return new Response(
      JSON.stringify({ ticket: { ...ticket, summary, tags, assignedAgentName } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Ticket creation failed:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
} 