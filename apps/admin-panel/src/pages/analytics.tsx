import * as React from 'react';
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'
import NavBar from '@/components/NavBar'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Ticket = {
  ticketId: string
  userMessage: string
  aiResponse: string
  createdAt: string
  status: 'open' | 'closed'
  tags?: string[]
}

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [emailTags, setEmailTags] = useState<string[]>([])

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase.from('tickets').select('*')
      if (data) setTickets(data)
    }
    fetchTickets()
    // Fetch email tags
    const fetchEmailTags = async () => {
      const res = await fetch('/api/admin/email-messages');
      if (res.ok) {
        const { emails } = await res.json();
        const tags = emails.flatMap((e: any) => e.tags || []);
        setEmailTags(tags);
      }
    };
    fetchEmailTags();
  }, [])

  const total = tickets.length
  const open = tickets.filter(t => t.status === 'open').length
  const closed = tickets.filter(t => t.status === 'closed').length
  const escalated = tickets.filter(t => t.aiResponse.includes('[create_ticket]')).length

  const pieData = [
    { name: 'Open', value: open },
    { name: 'Closed', value: closed },
  ]

  const barData = tickets.reduce<Record<string, number>>((acc, t) => {
    const date = new Date(t.createdAt).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const barChartData = Object.entries(barData).map(([date, count]) => ({
    date,
    count,
  }))

  // Tag analytics
  const tagCounts: Record<string, number> = {};
  tickets.forEach(ticket => {
    (ticket.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const tagData = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 tags

  // Agent performance analytics
  const agentStats: Record<string, { open: number; closed: number; total: number }> = {};
  tickets.forEach(ticket => {
    const agent = ticket.assignedAgentName || ticket.assigned_to_name || 'Unassigned';
    if (!agentStats[agent]) {
      agentStats[agent] = { open: 0, closed: 0, total: 0 };
    }
    agentStats[agent].total += 1;
    if (ticket.status === 'closed') {
      agentStats[agent].closed += 1;
    } else {
      agentStats[agent].open += 1;
    }
  });
  const agentChartData = Object.entries(agentStats).map(
    ([agent, stats]) => ({
      agent,
      ...stats,
    })
  );

  // Auto-Routing Review Analytics
  const autoAssigned = tickets.filter(t => t.assigned_to && (!t.updated_at || t.createdAt === t.updated_at));
  const unassigned = tickets.filter(t => !t.assigned_to);
  const manuallyReassigned = tickets.filter(t => t.assigned_to && t.updated_at && t.createdAt !== t.updated_at);
  const autoAssignedByAgent: Record<string, number> = {};
  autoAssigned.forEach(t => {
    const agent = t.assignedAgentName || t.assigned_to_name || 'Unknown';
    autoAssignedByAgent[agent] = (autoAssignedByAgent[agent] || 0) + 1;
  });
  const autoAssignedChartData = Object.entries(autoAssignedByAgent).map(([agent, count]) => ({ agent, count }));

  // Email tag analytics
  const emailTagCounts: Record<string, number> = {};
  emailTags.forEach(tag => {
    emailTagCounts[tag] = (emailTagCounts[tag] || 0) + 1;
  });
  const emailTagData = Object.entries(emailTagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 tags

  return (
    <>
      <Header />
      <NavBar />
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <h2 className="text-sm text-gray-600">Total Tickets</h2>
            <p className="text-xl font-bold">{total}</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm text-gray-600">Open</h2>
            <p className="text-xl font-bold">{open}</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm text-gray-600">Closed</h2>
            <p className="text-xl font-bold">{closed}</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm text-gray-600">Escalated</h2>
            <p className="text-xl font-bold">{escalated}</p>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="p-4">
            <h2 className="text-md font-semibold mb-2">Open vs Closed</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
                  <Cell fill="#60a5fa" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4">
            <h2 className="text-md font-semibold mb-2">Tickets per Day</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        {/* Tag Analytics Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Top Ticket Tags</h2>
          {tagData.length === 0 ? (
            <p className="text-gray-500">No tags found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagData}>
                <XAxis dataKey="tag" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1">
                  {tagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Agent performance analytics */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Agent Ticket Load</h2>
          {agentChartData.length === 0 ? (
            <p className="text-gray-500">No agent data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentChartData}>
                <XAxis dataKey="agent" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="open" stackId="a" fill="#f59e0b" />
                <Bar dataKey="closed" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Auto-Routing Review Analytics */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Auto-Routing Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <h2 className="text-sm text-gray-600">Auto-Assigned</h2>
              <p className="text-xl font-bold">{autoAssigned.length}</p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm text-gray-600">Unassigned</h2>
              <p className="text-xl font-bold">{unassigned.length}</p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm text-gray-600">Manually Reassigned</h2>
              <p className="text-xl font-bold">{manuallyReassigned.length}</p>
            </Card>
          </div>
          <h3 className="text-md font-semibold mb-2">Auto-Assigned Tickets by Agent</h3>
          {autoAssignedChartData.length === 0 ? (
            <p className="text-gray-500">No auto-assigned tickets found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={autoAssignedChartData}>
                <XAxis dataKey="agent" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Email Tag Analytics Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Top Email Tags</h2>
          {emailTagData.length === 0 ? (
            <p className="text-gray-500">No tags found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emailTagData}>
                <XAxis dataKey="tag" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1">
                  {emailTagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  )
} 