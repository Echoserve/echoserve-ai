import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../customer-widget/src/components/ui/Card';
import NavBar from '../components/NavBar';

const ROLE_META: Record<string, { label: string; color: string }> = {
  user: { label: 'User', color: 'bg-gray-200 text-gray-900' },
  ai: { label: 'AI', color: 'bg-blue-100 text-blue-900' },
  agent: { label: 'Agent', color: 'bg-green-100 text-green-900 border border-green-400' },
};

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  email: { label: 'Email', color: 'bg-yellow-100 text-yellow-800' },
  chat: { label: 'Chat', color: 'bg-blue-50 text-blue-700' },
};

function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'chat' | 'email'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'ai' | 'agent'>('all');
  const [insights, setInsights] = useState<{ summary: string; intents: string[]; sentiment: string } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      // Fetch unique emails from both sources
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      } else {
        setCustomers([]);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Fetch timeline when customer is selected
  useEffect(() => {
    if (!selectedCustomer) return;
    setTimelineLoading(true);
    setTimeline([]);
    fetch(`/api/admin/customers/timeline?email=${encodeURIComponent(selectedCustomer.email)}`)
      .then(res => res.json())
      .then(data => setTimeline(data.timeline || []))
      .finally(() => setTimelineLoading(false));
    // Fetch insights
    setInsights(null);
    setInsightsLoading(true);
    fetch(`/api/admin/customers/insights?email=${encodeURIComponent(selectedCustomer.email)}`)
      .then(res => res.json())
      .then(data => setInsights(data))
      .finally(() => setInsightsLoading(false));
  }, [selectedCustomer]);

  // Filtered timeline
  const filteredTimeline = timeline.filter(msg => {
    if (channelFilter !== 'all' && msg.channel !== channelFilter) return false;
    if (roleFilter !== 'all' && msg.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">Customers</h1>
        {loading ? (
          <div>Loading customers…</div>
        ) : customers.length === 0 ? (
          <div className="text-gray-500">No customers found.</div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer: any) => (
              <Card key={customer.email} className="p-4 cursor-pointer hover:bg-blue-50" onClick={() => setSelectedCustomer(customer)}>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-blue-700">{customer.email}</div>
                    <div className="text-xs text-gray-500">{customer.lastMessageDate ? new Date(customer.lastMessageDate).toLocaleString() : ''}</div>
                  </div>
                  <div className="text-xs text-gray-500">Total messages: {customer.totalMessages}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Modal for unified timeline */}
      <Dialog open={!!selectedCustomer} onClose={() => { setSelectedCustomer(null); setTimeline([]); }}>
        {selectedCustomer ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="font-semibold text-blue-700 text-lg mb-2">{selectedCustomer.email}</div>
            <div className="text-xs text-gray-500 mb-4">Total messages: {selectedCustomer.totalMessages} | Last: {selectedCustomer.lastMessageDate ? new Date(selectedCustomer.lastMessageDate).toLocaleString() : ''}</div>
            {/* AI Insights */}
            <div className="mb-4">
              {insightsLoading ? (
                <div className="text-gray-400">Loading summary…</div>
              ) : insights ? (
                <div className="space-y-2">
                  <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-900 text-sm">
                    <span className="font-semibold">Summary:</span> {insights.summary || <span className="italic text-gray-400">No summary available.</span>}
                  </div>
                  {insights.intents && insights.intents.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-semibold text-xs text-gray-500">Top Intents:</span>
                      {insights.intents.map((intent, i) => (
                        <span key={i} className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs font-medium">{intent}</span>
                      ))}
                    </div>
                  )}
                  {insights.sentiment && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-gray-500">Sentiment:</span>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium
                        ${insights.sentiment === 'Positive' ? 'bg-green-100 text-green-800 border border-green-300' : ''}
                        ${insights.sentiment === 'Neutral' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : ''}
                        ${insights.sentiment === 'Negative' ? 'bg-red-100 text-red-800 border border-red-300' : ''}
                      `}>{insights.sentiment}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {/* Filters */}
            <div className="flex gap-4 mb-2">
              <div>
                <label className="text-xs font-semibold mr-2">Channel:</label>
                <select className="border rounded px-2 py-1 text-xs" value={channelFilter} onChange={e => setChannelFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="chat">Chat</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mr-2">Role:</label>
                <select className="border rounded px-2 py-1 text-xs" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="user">User</option>
                  <option value="ai">AI</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
            </div>
            {/* Timeline */}
            <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-2">
              {timelineLoading ? (
                <div>Loading timeline…</div>
              ) : filteredTimeline.length === 0 ? (
                <div className="text-gray-400">No messages found.</div>
              ) : (
                filteredTimeline.map((msg, idx) => {
                  const roleMeta = ROLE_META[msg.role] || ROLE_META.user;
                  const channelMeta = CHANNEL_META[msg.channel] || CHANNEL_META.chat;
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <div className={`rounded-xl px-4 py-2 min-w-0 max-w-[75%] ${roleMeta.color} ${msg.role === 'agent' ? 'border-2 border-green-400' : ''}`}
                        style={{ wordBreak: 'break-word' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${channelMeta.color}`}>{channelMeta.label}</span>
                          <span className="text-xs font-semibold">{roleMeta.label}</span>
                          <span className="text-gray-400 font-normal text-xs">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                        </div>
                        <div className="whitespace-pre-line text-sm">{msg.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : <React.Fragment />}
      </Dialog>
    </div>
  );
} 