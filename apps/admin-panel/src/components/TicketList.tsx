import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../customer-widget/src/components/ui/Card";

// Updated Ticket type to include status and createdAt
export type Ticket = {
  ticketId: string;
  userMessage: string;
  aiResponse: string;
  status: string;
  createdAt: string;
  summary?: string; // Added for summary
  tags?: string[]; // Added for tags
  assignedAgentName?: string; // Added for assigned agent name
  assigned_to_name?: string; // Added for assigned agent name
  assigned_to?: string; // Added for assigned agent ID
};

const ROLE_META = {
  user: {
    label: 'User',
    color: 'bg-gray-200 text-gray-900',
    icon: (
      <span className="inline-block w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-700">U</span>
    ),
  },
  bot: {
    label: 'AI',
    color: 'bg-blue-100 text-blue-900',
    icon: (
      <span className="inline-block w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center font-bold text-white">🤖</span>
    ),
  },
  agent: {
    label: 'Agent',
    color: 'bg-green-100 text-green-900 border border-green-400',
    icon: (
      <span className="inline-block w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">A</span>
    ),
  },
};

export const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyTicket, setReplyTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentList, setAgentList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/tickets");
        if (!res.ok) throw new Error("Failed to fetch tickets");
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    // Fetch agents for reassignment dropdown
    const fetchAgents = async () => {
      const res = await fetch("/api/admin/agents");
      if (res.ok) {
        const data = await res.json();
        setAgentList(data.agents || []);
      }
    };
    fetchAgents();
  }, []);

  const openReply = async (ticket: Ticket) => {
    setReplyTicket(ticket);
    setReply('');
    setMsgLoading(true);
    // For demo, assume ticketId is session_id (adapt if needed)
    const session_id = ticket.ticketId;
    const res = await fetch(`/api/messages?session_id=${session_id}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setMsgLoading(false);
  };

  const sendReply = async () => {
    if (!replyTicket || !reply.trim()) return;
    setSending(true);
    const session_id = replyTicket.ticketId;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, role: 'agent', message: reply }),
    });
    // Optionally auto-close ticket
    await fetch('/api/admin/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: replyTicket.ticketId, newStatus: 'closed' }),
    });
    setTickets((prev) => prev.map(t => t.ticketId === replyTicket.ticketId ? { ...t, status: 'closed' } : t));
    setReplyTicket(null);
    setReply('');
    setSending(false);
  };

  const handleReassign = async (ticketId: string, newAgentId: string) => {
    setUpdatingId(ticketId);
    await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, newAgentId }),
    });
    setTickets((prev) => prev.map((t) => t.ticketId === ticketId ? { ...t, assigned_to: newAgentId } : t));
    setUpdatingId(null);
  };

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const allTags = Array.from(new Set(tickets.flatMap(t => t.tags || [])));
  const filteredTickets = activeTag
    ? tickets.filter((ticket) => ticket.tags?.includes(activeTag))
    : tickets;
  const agents = [...new Set(tickets.map(t => t.assignedAgentName || t.assigned_to_name).filter(Boolean))];
  const visibleTickets = selectedAgent
    ? filteredTickets.filter(t => (t.assignedAgentName || t.assigned_to_name) === selectedAgent)
    : filteredTickets;

  return (
    <div className="space-y-4">
      {/* Tag Filter Bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded font-semibold ${activeTag === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {allTags.map((tag) => (
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
      {/* Agent Filter Bar */}
      {agents.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded font-semibold ${selectedAgent === null ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setSelectedAgent(null)}
          >
            All Agents
          </button>
          {agents.map(agent => (
            <button
              key={agent}
              className={`px-3 py-1 rounded font-semibold ${selectedAgent === agent ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedAgent(agent ?? null)}
            >
              {agent}
            </button>
          ))}
        </div>
      )}
      {/* Ticket List */}
      {visibleTickets.length === 0 && <div>No tickets found.</div>}
      {visibleTickets.map((ticket) => {
        const isUpdating = updatingId === ticket.ticketId;
        const nextStatus = ticket.status === "open" ? "closed" : "open";
        const buttonLabel = ticket.status === "open" ? "Mark as Closed" : "Reopen Ticket";
        return (
          <Card key={ticket.ticketId} className="mb-4">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <h3 className="text-lg font-semibold">Ticket #{ticket.ticketId}</h3>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${ticket.status === 'closed' ? 'bg-gray-300 text-gray-700' : 'bg-blue-200 text-blue-900'}`}>{ticket.status}</span>
            </div>
            <CardContent className="space-y-2">
              <p><strong>User:</strong> {ticket.userMessage}</p>
              <p><strong>AI:</strong> {ticket.aiResponse}</p>
              {/* ✅ New: Summary */}
              {ticket.summary && (
                <p className="text-gray-500"><strong>Summary:</strong> {ticket.summary}</p>
              )}
              {/* ✅ New: Tags */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag: string) => (
                    <span key={tag} className="inline-block px-2 py-1 rounded border text-xs bg-gray-100 text-gray-700 border-gray-300">{tag}</span>
                  ))}
                </div>
              )}
              {ticket.assignedAgentName || ticket.assigned_to_name ? (
                <p className="text-sm text-gray-600">
                  Assigned to: <span className="font-medium">{ticket.assignedAgentName || ticket.assigned_to_name}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">Unassigned</p>
              )}
              <div className="flex items-center gap-2">
                <label htmlFor={`agent-select-${ticket.ticketId}`} className="text-xs text-gray-500">Reassign:</label>
                <select
                  id={`agent-select-${ticket.ticketId}`}
                  value={ticket.assigned_to || ''}
                  onChange={e => handleReassign(ticket.ticketId, e.target.value)}
                  className="border p-1 rounded text-sm"
                  disabled={updatingId === ticket.ticketId}
                >
                  <option value="">Unassigned</option>
                  {agentList.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500">
                Created: {new Date(ticket.createdAt).toLocaleString()}
              </p>
              {/* Reply + Close/Open Button */}
              <div className="flex gap-4 mt-2">
                <button className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-semibold" onClick={() => openReply(ticket)}>
                  Reply
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-500 text-white font-semibold disabled:opacity-50"
                  onClick={async () => {
                    setUpdatingId(ticket.ticketId);
                    try {
                      const res = await fetch("/api/admin/tickets", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ticketId: ticket.ticketId, newStatus: ticket.status === 'open' ? 'closed' : 'open' }),
                      });
                      if (!res.ok) throw new Error("Failed to update status");
                      setTickets((prev) => prev.map((t) => t.ticketId === ticket.ticketId ? { ...t, status: ticket.status === 'open' ? 'closed' : 'open' } : t));
                    } catch (e) {
                      // Optionally show error
                    } finally {
                      setUpdatingId(null);
                    }
                  }}
                  disabled={updatingId === ticket.ticketId}
                >
                  {updatingId === ticket.ticketId ? 'Updating...' : ticket.status === 'open' ? 'Mark as Closed' : 'Reopen'}
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {/* Modal for agent reply */}
      {replyTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setReplyTicket(null)}>&times;</button>
            <h2 className="text-lg font-bold mb-2">Reply to Ticket {replyTicket.ticketId}</h2>
            <div className="mb-4 h-64 overflow-y-auto border rounded p-2 bg-gray-50 flex flex-col gap-2">
              {msgLoading ? (
                <div>Loading conversation…</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400">No conversation history.</div>
              ) : (
                messages.map((msg, idx) => {
                  const meta = ROLE_META[msg.role] || ROLE_META.user;
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      {meta.icon}
                      <div className={`rounded-xl px-4 py-2 min-w-0 max-w-[75%] ${meta.color} ${msg.role === 'agent' ? 'border-2 border-green-400' : ''}`}
                        style={{ wordBreak: 'break-word' }}>
                        <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                          {meta.label}
                          <span className="text-gray-400 font-normal">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                        </div>
                        <div className="whitespace-pre-line text-sm">{msg.message}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-2"
              rows={3}
              placeholder="Type your reply…"
              value={reply}
              onChange={e => setReply(e.target.value)}
              disabled={sending}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
              onClick={sendReply}
              disabled={sending || !reply.trim()}
            >
              {sending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
