import { supabase } from '../../services/supabaseClient';

export const config = { runtime: 'edge' };

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ tickets: data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export default async function handler(req: Request) {
  if (req.method === "PATCH") {
    try {
      const body = await req.json();
      const { ticketId, newStatus, newAgentId } = body;
      if (!ticketId && !newAgentId) {
        return new Response(
          JSON.stringify({ error: "Missing ticketId or newAgentId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      // Agent reassignment
      if (newAgentId) {
        // Get current ticket to find previous agent
        const { data: ticket } = await supabase.from('tickets').select('assigned_to').eq('id', ticketId).single();
        const prevAgentId = ticket?.assigned_to;
        // Update ticket assignment
        await supabase.from('tickets').update({ assigned_to: newAgentId }).eq('id', ticketId);
        // Decrement previous agent load
        if (prevAgentId && prevAgentId !== newAgentId) {
          const { data: prevAgent } = await supabase.from('agents').select('current_load').eq('id', prevAgentId).single();
          if (prevAgent) {
            await supabase.from('agents').update({ current_load: Math.max(0, prevAgent.current_load - 1) }).eq('id', prevAgentId);
          }
        }
        // Increment new agent load
        if (newAgentId && prevAgentId !== newAgentId) {
          const { data: newAgent } = await supabase.from('agents').select('current_load').eq('id', newAgentId).single();
          if (newAgent) {
            await supabase.from('agents').update({ current_load: (newAgent.current_load || 0) + 1 }).eq('id', newAgentId);
          }
        }
        return new Response(
          JSON.stringify({ updated: true, ticketId, assigned_to: newAgentId }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      // Status update
      if (ticketId && newStatus) {
        if (newStatus !== "open" && newStatus !== "closed") {
          return new Response(
            JSON.stringify({ error: "Invalid status value" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        // Simulate update
        return new Response(
          JSON.stringify({ updated: true, ticketId, status: newStatus }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
} 