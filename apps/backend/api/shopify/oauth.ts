import { supabase } from '../../services/supabaseClient';
import { encrypt } from '../../utils/encryption';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');

  if (!code || !shop) {
    return new Response(
      JSON.stringify({ error: 'Missing code or shop parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(
        JSON.stringify({ error: 'Failed to get access token', details: err }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenRes.json();
    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'No access token returned from Shopify' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt the access token
    const encryptedToken = encrypt(access_token);

    // Store in Supabase
    const { error } = await supabase.from('store_integrations').insert([
      { store_url: shop, access_token: encryptedToken },
    ]);
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to save to Supabase', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success: return JSON or redirect
    // return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    return Response.redirect('https://yourdomain.com/shopify/connected', 302);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 