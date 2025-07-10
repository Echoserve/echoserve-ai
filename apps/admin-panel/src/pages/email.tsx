import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../customer-widget/src/components/ui/Card';
import { Input } from '../../../customer-widget/src/components/ui/Input';
import NavBar from '../components/NavBar';

function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
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

export default function EmailHistoryPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const res = await fetch('/api/admin/email-messages');
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      } else {
        setEmails([]);
      }
      setLoading(false);
    };
    fetchEmails();
  }, []);

  // Tag aggregation
  const allTags = Array.from(new Set(emails.flatMap(e => e.tags || [])));

  // Filtering logic
  const filteredEmails = emails.filter(email => {
    // Tag filter
    if (activeTag && !(email.tags || []).includes(activeTag)) return false;
    // Search filter
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (email.from && email.from.toLowerCase().includes(s)) ||
      (email.subject && email.subject.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">Email History</h1>
        {/* Tag Filter Bar */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded font-semibold ${activeTag === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`px-3 py-1 rounded font-semibold ${activeTag === tag ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-6">
          <Input
            className="flex-1"
            placeholder="Search by sender or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="ml-2 px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
        {loading ? (
          <div>Loading emails…</div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-gray-500">No emails found.</div>
        ) : (
          <div className="space-y-4">
            {filteredEmails.map(email => (
              <Card key={email.id} className="p-4">
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-blue-700">{email.subject}</div>
                    <div className="text-xs text-gray-500">{email.created_at ? new Date(email.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">From:</span> {email.from}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">Body:</span> {email.body?.slice(0, 80)}{email.body?.length > 80 ? '…' : ''}
                  </div>
                  <div className="text-xs text-green-700 mb-1">
                    <span className="font-medium">AI Reply:</span> {email.ai_reply?.slice(0, 80)}{email.ai_reply?.length > 80 ? '…' : ''}
                  </div>
                  {/* Tags as badges */}
                  {email.tags && email.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {email.tags.map((tag: string) => (
                        <span key={tag} className="inline-block px-2 py-1 rounded border text-xs bg-gray-100 text-gray-700 border-gray-300">{tag}</span>
                      ))}
                    </div>
                  )}
                  <button
                    className="mt-2 px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
                    onClick={() => setSelectedEmail(email)}
                  >
                    View
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Modal for viewing full email */}
      <Dialog open={!!selectedEmail} onClose={() => setSelectedEmail(null)}>
        {selectedEmail && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-blue-700 text-lg">{selectedEmail.subject}</div>
              <div className="text-xs text-gray-500">{selectedEmail.created_at ? new Date(selectedEmail.created_at).toLocaleString() : ''}</div>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">From:</span> {selectedEmail.from}
            </div>
            <div>
              <div className="font-medium text-xs text-gray-500 mb-1">Body:</div>
              <div className="bg-gray-50 border rounded p-2 text-sm whitespace-pre-line max-h-40 overflow-y-auto">{selectedEmail.body}</div>
            </div>
            <div>
              <div className="font-medium text-xs text-green-700 mb-1">AI Reply:</div>
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm whitespace-pre-line max-h-40 overflow-y-auto">{selectedEmail.ai_reply}</div>
            </div>
            {/* Tags in modal */}
            {selectedEmail.tags && selectedEmail.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedEmail.tags.map((tag: string) => (
                  <span key={tag} className="inline-block px-2 py-1 rounded border text-xs bg-gray-100 text-gray-700 border-gray-300">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
} 