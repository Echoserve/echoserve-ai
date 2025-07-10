import * as React from 'react';
import { useState, useEffect } from 'react';
import { Input } from '../../../customer-widget/src/components/ui/Input';
import { Button } from '../../../customer-widget/src/components/ui/Button';
import { Card } from '../../../customer-widget/src/components/ui/Card';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_SCOPES = 'read_orders,read_customers';
const SHOPIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
const REDIRECT_URI = 'https://yourdomain.com/api/shopify/oauth'; // Update to your deployed backend

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function IntegrationsPage() {
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setStores(data);
      } else {
        setStores([]);
      }
      setLoading(false);
    }
    fetchStores();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!shopDomain || !shopDomain.endsWith('.myshopify.com')) {
      setError('Please enter a valid Shopify store domain (e.g., mystore.myshopify.com)');
      return;
    }
    if (!SHOPIFY_CLIENT_ID) {
      setError('Shopify client ID is not set.');
      return;
    }
    const url = `https://${shopDomain}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Connect Shopify Store</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="mystore.myshopify.com"
              value={shopDomain}
              onChange={e => setShopDomain(e.target.value)}
              type="text"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">Connect Shopify Store</Button>
          </form>
        </Card>
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Connected Stores</h3>
          {loading ? (
            <p>Loading...</p>
          ) : stores.length === 0 ? (
            <p className="text-gray-500">No stores connected yet.</p>
          ) : (
            <ul className="space-y-3">
              {stores.map(store => (
                <li key={store.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium">{store.store_url}</div>
                    <div className="text-xs text-gray-500">
                      Connected {store.created_at ? new Date(store.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                  {/* <Button variant="outline" size="sm" disabled>Disconnect</Button> */}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
} 