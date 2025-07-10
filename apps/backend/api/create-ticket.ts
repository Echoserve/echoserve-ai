export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    if (req.method === 'OPTIONS') {
      // Preflight CORS
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
    const body = await req.json();
    const { company, callerName, issue, timestamp } = body;
    if (!company || !callerName || !issue || !timestamp) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
    // Log ticket (replace with DB/store later)
    console.log('[Vapi Ticket]', { company, callerName, issue, timestamp });
    return new Response(JSON.stringify({ status: 'ticket_created' }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
} 